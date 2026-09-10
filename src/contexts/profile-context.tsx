import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUser } from "@usehercules/auth/react";

export type ProfileType =
  | "individual"
  | "business"
  | "corporate"
  | "ngo"
  | "government"
  | "state_entity"
  // Financial institutions
  | "pension_fund"
  | "microfinance"
  | "cooperative"
  | "insurance"
  | "investment_fund"
  | "development_bank"
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
  individual: {
    name: "Jean Dupont",
    accountNumber: "4821",
    tier: "Premium ✦",
    currency: "XAF",
    balance: 7303000,
    balanceUSD: 12149,
  },
  business: {
    name: "Dupont & Fils SARL",
    accountNumber: "8830",
    tier: "Business Pro",
    currency: "XAF",
    balance: 42500000,
    balanceUSD: 70833,
  },
  corporate: {
    name: "CEMAC Holdings S.A.",
    accountNumber: "0012",
    tier: "Corporate Platinum",
    currency: "USD",
    balance: 2850000,
    balanceUSD: 2850000,
  },
  ngo: {
    name: "Fondation Ubuntu Centrafrique",
    accountNumber: "3371",
    tier: "NGO Verified",
    currency: "USD",
    balance: 385000,
    balanceUSD: 385000,
  },
  government: {
    name: "Ministère des Finances — RCA",
    accountNumber: "0001",
    tier: "Sovereign",
    currency: "XAF",
    balance: 68500000000,
    balanceUSD: 115970000,
  },
  state_entity: {
    name: "SODECA — Société des Eaux RCA",
    accountNumber: "0500",
    tier: "State Entity",
    currency: "XAF",
    balance: 4200000000,
    balanceUSD: 7108000,
  },
  pension_fund: {
    name: "CNSS RCA — Caisse de Retraite",
    accountNumber: "0720",
    tier: "Pension Fund",
    currency: "XAF",
    balance: 18700000000,
    balanceUSD: 31651000,
  },
  microfinance: {
    name: "ADIE Centrafrique",
    accountNumber: "2201",
    tier: "Microfinance",
    currency: "XAF",
    balance: 3150000000,
    balanceUSD: 5330000,
  },
  cooperative: {
    name: "MUCODEC Congo-Brazzaville",
    accountNumber: "4410",
    tier: "Cooperative",
    currency: "XAF",
    balance: 980000000,
    balanceUSD: 1659000,
  },
  insurance: {
    name: "AfricaRe Assurances",
    accountNumber: "3380",
    tier: "Insurance Entity",
    currency: "USD",
    balance: 14200000,
    balanceUSD: 14200000,
  },
  investment_fund: {
    name: "CEMAC Capital Fund",
    accountNumber: "5510",
    tier: "Investment Fund",
    currency: "USD",
    balance: 48500000,
    balanceUSD: 48500000,
  },
  development_bank: {
    name: "BDEAC — Banque de Développement CEMAC",
    accountNumber: "0100",
    tier: "Dev Bank",
    currency: "XAF",
    balance: 245000000000,
    balanceUSD: 414746000,
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
  const { id: userId } = useUser();
  const storageKey = `payrus_profile:${userId ?? "guest"}`;
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

  const setProfile = (p: ProfileData) => {
    setProfileState(p);
    try { localStorage.setItem(storageKey, JSON.stringify(p)); } catch { /* ignore */ }
  };

  const clearProfile = () => {
    setProfileState(null);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
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
