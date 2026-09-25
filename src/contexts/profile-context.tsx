import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLocalUserId } from "@/lib/local-user.ts";
import { useRoleDefinitions } from "@/hooks/use-backend.ts";
import type { RoleDefinition } from "@/lib/backend.ts";

export type ProfileType =
  | "personal"
  | "merchant"
  | "agent"
  | "treasury"
  | "public_institution"
  | "ngo"
  | "group"
  | "starter"
  // System
  | "admin";

export interface ProfileData {
  type: ProfileType;
  name: string;
  accountNumber: string;
  tier: string;
  currency: string;
  balance: number;
  balanceUSD: number;
}

interface ProfileContextValue {
  profile: ProfileData | null;
  setProfile: (profile: ProfileData) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// Profile templates live in the public.role_definitions table (see
// supabase/migrations/0022) — never hardcoded here. ProfileProvider fills
// this cache from the database at startup; getDefaultProfile reads it.
let roleTemplates: Record<string, Omit<ProfileData, "type">> = {};

function loadTemplates(defs: RoleDefinition[]) {
  roleTemplates = Object.fromEntries(
    defs.map((d) => [d.slug, {
      name: d.templateName, accountNumber: d.templateAccountNumber, tier: d.templateTier,
      currency: d.templateCurrency, balance: d.templateBalance, balanceUSD: d.templateBalanceUsd,
    }]),
  );
}

export function getDefaultProfile(type: ProfileType): ProfileData {
  const t = roleTemplates[type];
  return { type, ...(t ?? { name: type, accountNumber: "", tier: "", currency: "XAF", balance: 0, balanceUSD: 0 }) };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Falling back to "guest" for a visitor with no local identity would let
  // unrelated accounts on the same browser share one profile's data.
  const storageKey = `payrus_profile:${getLocalUserId() ?? "guest"}`;
  const [profile, setProfileState] = useState<ProfileData | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as ProfileData) : null;
    } catch {
      return null;
    }
  });
  const roleDefinitions = useRoleDefinitions();
  if (roleDefinitions) loadTemplates(roleDefinitions);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setProfileState(stored ? (JSON.parse(stored) as ProfileData) : null);
    } catch {
      setProfileState(null);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        setProfileState(event.newValue ? (JSON.parse(event.newValue) as ProfileData) : null);
      } catch {
        setProfileState(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // Recompute the key fresh at call time rather than closing over the
  // render-time `storageKey`: a login/registration flow calls
  // setLocalUserId(...) and then setProfile(...) synchronously in the same
  // handler, before ProfileProvider gets a chance to re-render — using the
  // stale closed-over key would write the profile under the previous
  // ("guest") identity and leave the just-signed-in user with no profile.
  const currentStorageKey = () => `payrus_profile:${getLocalUserId() ?? "guest"}`;

  const setProfile = (p: ProfileData) => {
    setProfileState(p);
    try { localStorage.setItem(currentStorageKey(), JSON.stringify(p)); } catch { /* ignore */ }
  };

  const clearProfile = () => {
    setProfileState(null);
    try { localStorage.removeItem(currentStorageKey()); } catch { /* ignore */ }
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
