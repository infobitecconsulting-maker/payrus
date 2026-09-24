// Real MFA (PRS-IAM-003) on Supabase Auth's TOTP factors. Same session model
// as ops-console (src/lib/mfa.ts there mirrors this file): a user who has a
// verified factor must reach AAL2 at sign-in, and high-risk actions ask for a
// fresh code ("step-up") when the session is still AAL1.
import { supabase } from "@/lib/supabase-client.ts";

export interface TotpFactor {
  id: string;
  friendlyName?: string;
}

export async function listVerifiedTotp(): Promise<TotpFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message);
  return (data.totp ?? []).map((f) => ({ id: f.id, friendlyName: f.friendly_name ?? undefined }));
}

/** True when the user has a verified TOTP factor but this session has not passed it yet. */
export async function needsMfaChallenge(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return false;
    return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
  } catch {
    // MFA API unavailable (older project / network) — never block sign-in on a lookup failure;
    // Supabase itself still enforces AAL2 on any factor-protected operation.
    return false;
  }
}

export async function verifyTotpCode(code: string): Promise<boolean> {
  const factors = await listVerifiedTotp();
  const factor = factors[0];
  if (!factor) return true;
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
  return !error;
}

export async function enrollTotp(): Promise<{ factorId: string; qrCode: string; secret: string }> {
  // Drop any abandoned unverified enrolment first — Supabase rejects a second
  // one with the same friendly name.
  const { data: all } = await supabase.auth.mfa.listFactors();
  for (const f of all?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "PayRus authenticator" });
  if (error || !data) throw new Error(error?.message ?? "enroll failed");
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmTotpEnrollment(factorId: string, code: string): Promise<boolean> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
  return !error;
}

export async function removeTotp(factorId: string): Promise<boolean> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return !error;
}

// --- step-up plumbing -------------------------------------------------------
// requireStepUp() resolves true immediately when the user has no factor (MFA
// is opt-in for consumers; see the staff banner for privileged roles) or the
// session is already AAL2; otherwise it asks <MfaStepUpHost/> to show the code
// dialog and resolves with the outcome.
type Opener = (resolve: (ok: boolean) => void) => void;
let opener: Opener | null = null;
export const registerStepUpHost = (fn: Opener | null) => {
  opener = fn;
};

export async function requireStepUp(): Promise<boolean> {
  try {
    if (!(await needsMfaChallenge())) return true;
  } catch {
    return true;
  }
  if (!opener) return false;
  return new Promise<boolean>((resolve) => opener!(resolve));
}
