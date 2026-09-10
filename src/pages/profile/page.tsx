import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  User, Briefcase, Building2, Heart, Landmark, Shield,
  ChevronRight, CheckCircle2, ArrowLeft, Sparkles,
  PiggyBank, Coins, HandshakeIcon, Umbrella, TrendingUp, Banknote,
  Phone, Upload, ScanFace, IdCard, RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp.tsx";
import { useProfile, type ProfileType, getDefaultProfile } from "@/contexts/profile-context.tsx";

/* ─── Config ─────────────────────────────────────────────── */
interface ProfileTypeConfig {
  id: ProfileType;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  badgeClass: string;
  features: string[];
}

type Category = {
  key: string;
  profiles: ProfileTypeConfig[];
};

const CATEGORIES: Category[] = [
  {
    key: "personal",
    profiles: [
      {
        id: "individual",
        icon: User,
        colorClass: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        features: ["profile.feat.personal_wallet", "profile.feat.mobile_money", "profile.feat.remittance", "profile.feat.fx_converter"],
      },
      {
        id: "business",
        icon: Briefcase,
        colorClass: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
        badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        features: ["profile.feat.multi_user", "profile.feat.invoicing", "profile.feat.payroll", "profile.feat.bulk_payments"],
      },
      {
        id: "corporate",
        icon: Building2,
        colorClass: "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
        badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/30",
        features: ["profile.feat.treasury", "profile.feat.api_access", "profile.feat.multi_currency", "profile.feat.dedicated_manager"],
      },
      {
        id: "ngo",
        icon: Heart,
        colorClass: "from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400",
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        features: ["profile.feat.donor_payments", "profile.feat.grant_tracking", "profile.feat.zero_fees", "profile.feat.ngo_reporting"],
      },
    ],
  },
  {
    key: "financial",
    profiles: [
      {
        id: "pension_fund",
        icon: PiggyBank,
        colorClass: "from-teal-500/20 to-teal-600/5 border-teal-500/30 text-teal-400",
        badgeClass: "bg-teal-500/10 text-teal-400 border-teal-500/30",
        features: ["profile.feat.pension_accounts", "profile.feat.contributor_mgmt", "profile.feat.annuity_payments", "profile.feat.actuarial_reports"],
      },
      {
        id: "microfinance",
        icon: Coins,
        colorClass: "from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400",
        badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/30",
        features: ["profile.feat.microloan_mgmt", "profile.feat.group_savings", "profile.feat.agent_network", "profile.feat.mfi_reporting"],
      },
      {
        id: "cooperative",
        icon: HandshakeIcon,
        colorClass: "from-lime-500/20 to-lime-600/5 border-lime-500/30 text-lime-400",
        badgeClass: "bg-lime-500/10 text-lime-400 border-lime-500/30",
        features: ["profile.feat.member_accounts", "profile.feat.savings_loans", "profile.feat.dividend_payments", "profile.feat.sacco_governance"],
      },
      {
        id: "insurance",
        icon: Umbrella,
        colorClass: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400",
        badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
        features: ["profile.feat.premium_collection", "profile.feat.claims_payments", "profile.feat.policy_mgmt", "profile.feat.reinsurance"],
      },
      {
        id: "investment_fund",
        icon: TrendingUp,
        colorClass: "from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400",
        badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        features: ["profile.feat.portfolio_mgmt", "profile.feat.fund_transfers", "profile.feat.yield_distribution", "profile.feat.investor_reporting"],
      },
      {
        id: "development_bank",
        icon: Banknote,
        colorClass: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-400",
        badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
        features: ["profile.feat.project_financing", "profile.feat.sovereign_loans", "profile.feat.interbank", "profile.feat.development_reporting"],
      },
    ],
  },
  {
    key: "public",
    profiles: [
      {
        id: "government",
        icon: Landmark,
        colorClass: "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        features: ["profile.feat.sovereign_account", "profile.feat.tax_collection", "profile.feat.interbank", "profile.feat.audit_trail"],
      },
      {
        id: "state_entity",
        icon: Shield,
        colorClass: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400",
        badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        features: ["profile.feat.public_payroll", "profile.feat.procurement", "profile.feat.treasury_mgmt", "profile.feat.compliance"],
      },
    ],
  },
  {
    key: "system",
    profiles: [
      {
        id: "admin" as ProfileType,
        icon: TrendingUp,
        colorClass: "from-primary/20 to-emerald-600/5 border-primary/30 text-primary",
        badgeClass: "bg-primary/10 text-primary border-primary/30",
        features: ["profile.feat.personal_wallet", "profile.feat.sovereign_account", "profile.feat.api_access", "profile.feat.audit_trail"],
      },
    ],
  },
];

/* Flatten for lookups */
const ALL_PROFILES = CATEGORIES.flatMap(c => c.profiles);

type Step = "select" | "detail" | "verify" | "complete";
const ID_TYPES = ["national", "passport", "voter"] as const;
type IdType = (typeof ID_TYPES)[number];

export default function ProfileSelection() {
  const { lng } = useParams<{ lng: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const { profile: activeProfile, setProfile } = useProfile();

  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const setProfileTypeRemote = useMutation(api.users.setProfileType);
  const submitKyc = useMutation(api.users.submitKyc);

  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const [orgName, setOrgName] = useState("");

  // KYC/verification sub-wizard state (kept local to this page — mirrors the
  // registration flow's fields but runs after profile selection, since the
  // profile picked determines which verification tier applies).
  const [kycStep, setKycStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpResent, setOtpResent] = useState(false);
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState<IdType>("national");
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedConfig = ALL_PROFILES.find(p => p.id === selected);
  const base = `/${lng ?? "en"}`;

  // If this device has no local profile yet but the account already picked
  // one elsewhere (Convex is the source of truth), restore it instead of
  // asking again — keeps auth and profile selection in sync across devices.
  useEffect(() => {
    if (!activeProfile && currentUser?.profileType) {
      setProfile(getDefaultProfile(currentUser.profileType as ProfileType));
    }
  }, [activeProfile, currentUser?.profileType, setProfile]);

  const handleSelect = (id: ProfileType) => {
    setSelected(id);
    setStep("detail");
  };

  const handleConfirm = () => {
    if (!selected) return;
    setPhone(currentUser?.phone ?? "");
    setKycStep(0);
    setStep("verify");
  };

  const handleKycSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await submitKyc({ phone, dateOfBirth: dob, address, idType });
      await setProfileTypeRemote({ profileType: selected });
    } catch {
      // Demo build: Convex may be unreachable (offline/local dev without a
      // deployment). Fall through to activating the profile locally anyway.
    }
    const profile = getDefaultProfile(selected);
    if (orgName.trim() && selected !== "individual") {
      profile.name = orgName.trim();
    }
    setProfile(profile);
    setSubmitting(false);
    setStep("complete");
    setTimeout(() => navigate(base), 1800);
  };

  const kycTitles = [
    t("profile.kyc.titlePhone"), t("profile.kyc.titleDetails"),
    t("profile.kyc.titleId"), t("profile.kyc.titleSelfie"),
  ];
  const kycReady = [
    phone.trim().length >= 6 && otp.trim().length === 6,
    dob.trim().length > 0 && address.trim().length > 0,
    frontUploaded && backUploaded,
    selfieTaken,
  ];

  return (
    <div className="min-h-full bg-background flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Select ── */}
            {step === "select" && (
              <motion.div key="select" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }} className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <Sparkles size={12} className="text-primary" />
                    <span className="text-xs text-primary font-medium">{t("profile.step1of2")}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">{t("profile.selectTitle")}</h1>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">{t("profile.selectSub")}</p>
                </div>

                {CATEGORIES.map((cat, ci) => (
                  <div key={cat.key}>
                    {/* Category header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-border" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">{t(`profile.category.${cat.key}.label`)}</div>
                        <div className="text-[10px] text-muted-foreground">{t(`profile.category.${cat.key}.desc`)}</div>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cat.profiles.map((pt, i) => (
                        <motion.button
                          key={pt.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ci * 0.08 + i * 0.04 }}
                          onClick={() => handleSelect(pt.id)}
                          className={cn(
                            "relative p-4 rounded-2xl bg-gradient-to-br border text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group",
                            pt.colorClass
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", pt.badgeClass)}>
                              <pt.icon size={19} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground text-sm leading-tight">{t(`profile.type.${pt.id}`)}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{t(`profile.desc.${pt.id}`)}</div>
                            </div>
                            <ChevronRight size={15} className="text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {pt.features.slice(0, 3).map(f => (
                              <span key={f} className={cn("text-[10px] px-1.5 py-0.5 rounded-md border font-medium", pt.badgeClass)}>
                                {t(f)}
                              </span>
                            ))}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Step 2: Details ── */}
            {step === "detail" && selectedConfig && (
              <motion.div key="detail" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }} className="max-w-md mx-auto space-y-5">
                <button onClick={() => setStep("select")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm">
                  <ArrowLeft size={15} /> {t("profile.back")}
                </button>

                <div className="text-center space-y-2">
                  <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-2xl border mx-auto", selectedConfig.badgeClass)}>
                    <selectedConfig.icon size={30} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{t(`profile.type.${selected}`)}</h2>
                  <p className="text-sm text-muted-foreground">{t(`profile.desc.${selected}`)}</p>
                </div>

                {/* Features list */}
                <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("profile.includes")}</div>
                  {selectedConfig.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 size={14} className="text-primary shrink-0" />
                      <span className="text-sm text-foreground">{t(f)}</span>
                    </div>
                  ))}
                </div>

                {/* Special notice for financial institutions */}
                {(["pension_fund","microfinance","cooperative","insurance","investment_fund","development_bank"] as ProfileType[]).includes(selected!) && (
                  <div className="rounded-xl bg-accent/10 border border-accent/30 p-3 space-y-1">
                    <div className="text-xs font-semibold text-accent">
                      {t("profile.fiNotice.title")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("profile.fiNotice.body")}
                    </p>
                  </div>
                )}

                {/* Org name field */}
                {selected !== "individual" && (
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground font-medium">{t("profile.orgName")}</label>
                    <Input
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder={t("profile.orgNamePlaceholder")}
                      className="bg-card border-border"
                    />
                  </div>
                )}

                {/* KYC notice */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{t("profile.kycNotice")}</p>
                </div>

                <Button onClick={handleConfirm} className="w-full h-12 text-base font-semibold rounded-xl">
                  {t("profile.activate")}
                </Button>
              </motion.div>
            )}

            {/* ── Step 3: Verify (KYC wizard) ── */}
            {step === "verify" && selectedConfig && (
              <motion.div key="verify" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }} className="max-w-md mx-auto space-y-5">
                <button
                  onClick={() => (kycStep === 0 ? setStep("detail") : setKycStep(s => s - 1))}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm"
                >
                  <ArrowLeft size={15} /> {t("profile.kyc.back")}
                </button>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">{kycTitles[kycStep]}</h2>
                  <p className="text-sm text-muted-foreground">{t("profile.kyc.stepSub", { type: t(`profile.type.${selected}`) })}</p>
                  <Progress value={((kycStep + 1) / 4) * 100} className="h-1.5" />
                  <div className="text-xs text-muted-foreground">{t("profile.kyc.progress", { step: kycStep + 1 })}</div>
                </div>

                <div className="rounded-2xl bg-card border border-border p-4">
                  {kycStep === 0 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-medium">{t("profile.kyc.phoneLabel")}</Label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder={t("profile.kyc.phonePlaceholder")}
                            className="bg-background border-border pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{t("profile.kyc.otpSent", { phone: phone || t("profile.kyc.phonePlaceholder") })}</p>
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
                          </InputOTPGroup>
                        </InputOTP>
                        <button
                          type="button"
                          onClick={() => setOtpResent(true)}
                          className={cn("text-xs font-medium cursor-pointer", otpResent ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                        >
                          <RotateCw size={11} className="inline mr-1" />
                          {otpResent ? t("profile.kyc.codeResent") : t("profile.kyc.resendCode")}
                        </button>
                      </div>
                    </div>
                  )}

                  {kycStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-medium">{t("profile.kyc.dobLabel")}</Label>
                        <Input type="date" value={dob} onChange={e => setDob(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-medium">{t("profile.kyc.addressLabel")}</Label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground font-medium">{t("profile.kyc.idTypeLabel")}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {ID_TYPES.map(idt => (
                            <button
                              key={idt}
                              type="button"
                              onClick={() => setIdType(idt)}
                              className={cn(
                                "text-xs font-semibold px-2 py-2.5 rounded-xl border transition-colors cursor-pointer",
                                idType === idt ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {t(`profile.kyc.id${idt === "national" ? "National" : idt === "passport" ? "Passport" : "Voter"}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {kycStep === 2 && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setFrontUploaded(v => !v)}
                        className={cn(
                          "w-full flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors",
                          frontUploaded ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30",
                        )}
                      >
                        {frontUploaded ? <CheckCircle2 size={26} className="text-primary" /> : <IdCard size={26} className="text-muted-foreground" />}
                        <span className={cn("text-xs font-medium", frontUploaded ? "text-primary" : "text-muted-foreground")}>
                          {frontUploaded ? t("profile.kyc.uploadedFront") : t("profile.kyc.uploadFront")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackUploaded(v => !v)}
                        className={cn(
                          "w-full flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors",
                          backUploaded ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30",
                        )}
                      >
                        {backUploaded ? <CheckCircle2 size={26} className="text-primary" /> : <Upload size={26} className="text-muted-foreground" />}
                        <span className={cn("text-xs font-medium", backUploaded ? "text-primary" : "text-muted-foreground")}>
                          {backUploaded ? t("profile.kyc.uploadedBack") : t("profile.kyc.uploadBack")}
                        </span>
                      </button>
                    </div>
                  )}

                  {kycStep === 3 && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <p className="text-xs text-muted-foreground text-center max-w-xs">{t("profile.kyc.selfiePrompt")}</p>
                      <button
                        type="button"
                        onClick={() => setSelfieTaken(v => !v)}
                        className={cn(
                          "w-36 h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                          selfieTaken ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30",
                        )}
                      >
                        {selfieTaken ? <CheckCircle2 size={30} className="text-primary" /> : <ScanFace size={30} className="text-muted-foreground" />}
                        <span className={cn("text-xs font-medium", selfieTaken ? "text-primary" : "text-muted-foreground")}>
                          {selfieTaken ? t("profile.kyc.selfieCaptured") : t("profile.kyc.selfieCta")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {kycStep < 3 ? (
                  <Button
                    onClick={() => setKycStep(s => s + 1)}
                    disabled={!kycReady[kycStep]}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    {t("profile.kyc.continue")}
                  </Button>
                ) : (
                  <Button
                    onClick={handleKycSubmit}
                    disabled={!kycReady[3] || submitting}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    {t("profile.kyc.submit")}
                  </Button>
                )}
              </motion.div>
            )}

            {/* ── Step 4: Success ── */}
            {step === "complete" && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center text-center py-16 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}>
                  <CheckCircle2 size={72} className="text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">{t("profile.activated")}</h2>
                <p className="text-muted-foreground max-w-xs">{t("profile.activatedSub")}</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
