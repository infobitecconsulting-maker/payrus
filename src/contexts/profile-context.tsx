import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLocalUserId } from "@/lib/local-user.ts";

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

const PROFILES: Record<ProfileType, Omit<ProfileData, "type">> = {
  personal: {
    name: "Jean Dupont",
    accountNumber: "4821",
    tier: "Premium ✦",
    currency: "XAF",
    balance: 7303000,
    balanceUSD: 12149,
  },
  merchant: {
    name: "Dupont & Fils SARL",
    accountNumber: "8830",
    tier: "Merchant Pro",
    currency: "XAF",
    balance: 42500000,
    balanceUSD: 70833,
  },
  agent: {
    name: "Kiosque Mama Amina — Mobile Money",
    accountNumber: "1190",
    tier: "Agent Network",
    currency: "XAF",
    balance: 3850000,
    balanceUSD: 6417,
  },
  treasury: {
    name: "CEMAC Holdings S.A.",
    accountNumber: "0012",
    tier: "Corporate Treasury",
    currency: "USD",
    balance: 2850000,
    balanceUSD: 2850000,
  },
  public_institution: {
    name: "Ministère des Finances — RCA",
    accountNumber: "0001",
    tier: "Sovereign",
    currency: "XAF",
    balance: 68500000000,
    balanceUSD: 115970000,
  },
  ngo: {
    name: "Fondation Ubuntu Centrafrique",
    accountNumber: "3371",
    tier: "NGO Verified",
    currency: "USD",
    balance: 385000,
    balanceUSD: 385000,
  },
  group: {
    name: "MUCODEC Congo-Brazzaville",
    accountNumber: "4410",
    tier: "Group / Cooperative",
    currency: "XAF",
    balance: 980000000,
    balanceUSD: 1659000,
  },
  starter: {
    name: "New PayRus Member",
    accountNumber: "9002",
    tier: "Starter",
    currency: "XAF",
    balance: 25000,
    balanceUSD: 42,
  },
  admin: {
    name: "PayRus System Administrator",
    accountNumber: "0000",
    tier: "System Admin",
    currency: "XAF",
    balance: 0,
    balanceUSD: 0,
  },
};

export function getDefaultProfile(type: ProfileType): ProfileData {
  return { type, ...PROFILES[type] };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Falling back to "guest" for a visitor with no local identity would let
  // unrelated accounts on the same browser share one profile's data.
  const storageKey = `payrus_profile:${getLocalUserId() ?? "guest"}`;
  const [profile, setProfileState] = useState<ProfileData | null>(null);

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
