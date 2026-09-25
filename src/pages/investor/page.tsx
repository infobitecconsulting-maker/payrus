import { motion } from "motion/react";
import { flagToIso, useCapabilityLevel } from "@/lib/capability.ts";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/ui/page-header.tsx";
import {
  TrendingUp, Globe, Users, DollarSign, BarChart2,
  Shield, Zap, Building2, ArrowUpRight, ChevronRight,
  MapPin, Landmark, CheckCircle, Target, Award, Layers
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────

const REMITTANCE_GROWTH = [
  { year: "2018", value: 46 }, { year: "2019", value: 52 },
  { year: "2020", value: 44 }, { year: "2021", value: 53 },
  { year: "2022", value: 64 }, { year: "2023", value: 54 },
  { year: "2024", value: 58 }, { year: "2025", value: 63 },
  { year: "2026P", value: 72 }, { year: "2028P", value: 88 },
  { year: "2030P", value: 110 },
];

const TAM_BREAKDOWN = [
  { name: "Remittances", value: 58, color: "oklch(0.66 0.20 138)" },
  { name: "Trade Finance", value: 22, color: "oklch(0.65 0.17 218)" },
  { name: "Gov Payments", value: 12, color: "oklch(0.70 0.16 85)" },
  { name: "Diaspora Savings", value: 8, color: "oklch(0.65 0.20 300)" },
];

const COUNTRIES: {
  flag: string; name: string; currency: string; remittance: string;
  diaspora: string; banked: string; mobile: string;
  opportunity: string; corridor: string; status: "active" | "pipeline" | "phase3" | "phase4";
  founding?: boolean; phase: number;
}[] = [
  // ── PHASE 1: CEMAC (XAF) — ALL LIVE ──
  { flag: "🇨🇫", name: "Central African Rep.", currency: "XAF", remittance: "$55M", diaspora: "0.15M", banked: "8%", mobile: "27%", opportunity: "PayRus Founding Market — HQ in Bangui. 92% unbanked — highest in CEMAC. Mobile-first leapfrog opportunity. Agent network replacing informal hawala at scale.", corridor: "FR · CM · CG → CF", status: "active", founding: true, phase: 1 },
  { flag: "🇨🇬", name: "Congo-Brazzaville", currency: "XAF", remittance: "$145M", diaspora: "0.3M", banked: "28%", mobile: "51%", opportunity: "Co-Founding Market — BDEAC headquartered in Brazzaville. Oil-driven economy. MTN and Airtel integrated. Gateway between CEMAC and Congo Basin.", corridor: "FR · CN · CF → CG", status: "active", founding: true, phase: 1 },
  { flag: "🇨🇲", name: "Cameroon", currency: "XAF", remittance: "$340M", diaspora: "0.9M", banked: "35%", mobile: "68%", opportunity: "CEMAC economic hub. Dual francophone/anglophone corridor. Highest mobile money penetration in Central Africa. Yaoundé hosts BEAC central bank.", corridor: "FR · DE · US → CM", status: "active", phase: 1 },
  { flag: "🇬🇦", name: "Gabon", currency: "XAF", remittance: "$90M", diaspora: "0.1M", banked: "58%", mobile: "72%", opportunity: "Highest per-capita income in CEMAC. Libreville is a regional financial hub. Strong French diaspora corridor.", corridor: "FR · CN → GA", status: "active", phase: 1 },
  { flag: "🇹🇩", name: "Chad", currency: "XAF", remittance: "$120M", diaspora: "0.2M", banked: "11%", mobile: "38%", opportunity: "2nd lowest banking penetration in CEMAC. Oil revenues via N'Djaména hub. Sahel corridor bridging AE and Saudi Arabia.", corridor: "FR · AE · SA → TD", status: "active", phase: 1 },
  { flag: "🇬🇶", name: "Equatorial Guinea", currency: "XAF", remittance: "$38M", diaspora: "0.08M", banked: "31%", mobile: "44%", opportunity: "Oil-rich micro-state. Spanish/French bilingual corridor. CEMAC banking hub project in Malabo.", corridor: "ES · FR → GQ", status: "active", phase: 1 },
  // ── PHASE 2: DRC + Southern Africa near CEMAC ──
  { flag: "🇨🇩", name: "DR Congo", currency: "CDF", remittance: "$2.1B", diaspora: "4.2M", banked: "26%", mobile: "47%", opportunity: "Phase 2 Priority — largest near-term expansion. Congo Basin corridor drives 72% of CEMAC inbound remittance. CDF volatility creates strong USD demand. Natural extension via Brazzaville gateway.", corridor: "BE · FR · US → CD", status: "pipeline", phase: 2 },
  { flag: "🇦🇴", name: "Angola", currency: "AOA", remittance: "$0.85B", diaspora: "0.5M", banked: "29%", mobile: "49%", opportunity: "Portuguese-speaking SADC powerhouse. Oil economy drives massive labour diaspora. Shared 2,600km border with DRC — critical Southern CEMAC link. Luanda is Southern Africa's fastest-growing financial centre.", corridor: "PT · BR · CN → AO", status: "pipeline", phase: 2 },
  { flag: "🇳🇦", name: "Namibia", currency: "NAD", remittance: "$0.12B", diaspora: "0.15M", banked: "71%", mobile: "80%", opportunity: "Southern Africa gateway. High banking coverage but low cross-border efficiency. SADC payment rail entry point. Windhoek corridor links PayRus to Botswana, Zambia, and ZAR bloc.", corridor: "ZA · DE · UK → NA", status: "pipeline", phase: 2 },
  { flag: "🇸🇳", name: "Senegal", currency: "XOF", remittance: "$2.8B", diaspora: "0.7M", banked: "42%", mobile: "78%", opportunity: "Remittances = 10.7% of GDP. Wave & Orange dominant — integration ready. WAEMU hub expansion.", corridor: "FR · IT · ES → SN", status: "pipeline", phase: 2 },
  { flag: "🇨🇮", name: "Côte d'Ivoire", currency: "XOF", remittance: "$500M", diaspora: "0.4M", banked: "41%", mobile: "71%", opportunity: "WAEMU financial hub. Mobile money leader in ECOWAS zone. Phase 2 XOF bloc expansion.", corridor: "FR · DE → CI", status: "pipeline", phase: 2 },
  { flag: "🇳🇬", name: "Nigeria", currency: "NGN", remittance: "$20.5B", diaspora: "1.7M", banked: "45%", mobile: "55%", opportunity: "Largest remittance recipient in Africa. NGN devaluation drives USD demand. Lagos tech ecosystem accelerates fintech adoption.", corridor: "UK · US · CA → NG", status: "pipeline", phase: 2 },
  { flag: "🇬🇭", name: "Ghana", currency: "GHS", remittance: "$4.7B", diaspora: "1.4M", banked: "58%", mobile: "62%", opportunity: "High financial literacy. GHS depreciation accelerates diaspora FX transfers. Accra is West Africa's fintech capital.", corridor: "UK · US → GH", status: "pipeline", phase: 2 },
  // ── PHASE 3: EAC FULL BLOC ──
  { flag: "🇰🇪", name: "Kenya", currency: "KES", remittance: "$4.0B", diaspora: "0.8M", banked: "83%", mobile: "90%", opportunity: "EAC anchor. M-Pesa infrastructure enables instant last-mile delivery. Nairobi as continental fintech hub. PayRus IPO listing candidate (NSE).", corridor: "UK · US · AE → KE", status: "phase3", phase: 3 },
  { flag: "🇹🇿", name: "Tanzania", currency: "TZS", remittance: "$0.55B", diaspora: "0.4M", banked: "40%", mobile: "67%", opportunity: "EAC's largest economy by land. Dar es Salaam port drives trade finance corridor. Strong Zanzibar tourism remittance from UAE and Gulf.", corridor: "AE · UK · CN → TZ", status: "phase3", phase: 3 },
  { flag: "🇺🇬", name: "Uganda", currency: "UGX", remittance: "$1.4B", diaspora: "0.7M", banked: "47%", mobile: "61%", opportunity: "EAC fast-grower. Large informal cross-border trade with DRC and South Sudan. MTN Uganda dominant with 12M mobile money wallets.", corridor: "AE · UK · US → UG", status: "phase3", phase: 3 },
  { flag: "🇷🇼", name: "Rwanda", currency: "RWF", remittance: "$0.28B", diaspora: "0.2M", banked: "93%", mobile: "85%", opportunity: "Africa's most banked and digital-first nation. Kigali as pan-African fintech regulation hub. EAC integration model.", corridor: "BE · US → RW", status: "phase3", phase: 3 },
  { flag: "🇧🇮", name: "Burundi", currency: "BIF", remittance: "$0.10B", diaspora: "0.3M", banked: "7%", mobile: "22%", opportunity: "Lowest banking penetration in EAC — extreme exclusion mirrors CAR. High PayRus agent network opportunity. Bujumbura corridor linked to DRC and Tanzania.", corridor: "BE · FR · UG → BI", status: "phase3", phase: 3 },
  { flag: "🇸🇸", name: "South Sudan", currency: "SSP", remittance: "$0.08B", diaspora: "0.5M", banked: "4%", mobile: "18%", opportunity: "Newest EAC member. Most financially excluded nation on continent — pure PayRus agent model. Oil corridor to Uganda and Ethiopia.", corridor: "AE · UG · ET → SS", status: "phase3", phase: 3 },
  { flag: "🇩🇯", name: "Djibouti", currency: "DJF", remittance: "$0.38B", diaspora: "0.1M", banked: "24%", mobile: "45%", opportunity: "Red Sea trade hub. USD-pegged economy with massive Ethiopian transit trade. Port of Djibouti = Horn of Africa gateway.", corridor: "AE · ET · FR → DJ", status: "phase3", phase: 3 },
  { flag: "🇪🇹", name: "Ethiopia", currency: "ETB", remittance: "$6.2B", diaspora: "3.0M", banked: "35%", mobile: "43%", opportunity: "Africa's 2nd largest population. Addis Ababa is AU headquarters. Telebirr mobile money reached 35M users in 3 years — fastest fintech adoption on continent.", corridor: "US · AE · SA → ET", status: "phase3", phase: 3 },
  // ── PHASE 4: NORTH/SOUTH AFRICA + GLOBAL ANCHOR ──
  { flag: "🇲🇦", name: "Morocco", currency: "MAD", remittance: "$11.2B", diaspora: "5.0M", banked: "71%", mobile: "55%", opportunity: "3rd largest African remittance market. EU-Morocco corridor is Europe's biggest African corridor. Casablanca Finance City as Phase 4 North Africa hub.", corridor: "FR · ES · IT → MA", status: "phase4", phase: 4 },
  { flag: "🇿🇦", name: "South Africa", currency: "ZAR", remittance: "$0.9B", diaspora: "0.9M", banked: "80%", mobile: "52%", opportunity: "SADC payment superhub. Largest economy south of Sahara. JSE listing potential. ZAR liquidity anchor for southern corridor.", corridor: "UK · DE · AU → ZA", status: "phase4", phase: 4 },
  { flag: "🇿🇲", name: "Zambia", currency: "ZMW", remittance: "$0.18B", diaspora: "0.2M", banked: "45%", mobile: "60%", opportunity: "SADC copper-belt economy. Bridge between Angola, DRC, Zimbabwe and Namibia. Regional transit payment corridor.", corridor: "AO · ZA · CN → ZM", status: "phase4", phase: 4 },
  { flag: "🇲🇿", name: "Mozambique", currency: "MZN", remittance: "$0.38B", diaspora: "0.4M", banked: "28%", mobile: "52%", opportunity: "Portuguese-speaking SADC. Natural Angola-Mozambique PayRus lusophone corridor. LNG economy driving new labour diaspora to Middle East.", corridor: "AE · ZA · PT → MZ", status: "phase4", phase: 4 },
  { flag: "🇪🇬", name: "Egypt", currency: "EGP", remittance: "$28.3B", diaspora: "9.5M", banked: "33%", mobile: "31%", opportunity: "Largest remittance recipient in Arab world. EGP devaluation drives record USD demand. Cairo is major African business travel hub — direct corridor for diaspora transiting through Africa.", corridor: "SA · AE · UK → EG", status: "phase4", phase: 4 },
];

// ── GLOBAL DIASPORA CORRIDORS ─────────────────────────────────────────────────
const DIASPORA_HUBS: {
  flag: string; city: string; country: string; region: string;
  africans: string; primaryOrigin: string; annualFlow: string; role: string;
  color: string;
}[] = [
  { flag: "🇦🇪", city: "Dubai / Abu Dhabi", country: "UAE", region: "Gulf", africans: "850K+", primaryOrigin: "EAC · Horn · CEMAC", annualFlow: "$9.2B", role: "Top remittance origin for East Africa, DRC, Ethiopia, and CEMAC. African traders (textiles, electronics, gold) use Dubai as a transit clearing hub. PayRus UAE wallet enables multi-currency settlement.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { flag: "🇨🇳", city: "Guangzhou / Yiwu", country: "China", region: "Asia", africans: "500K+", primaryOrigin: "West Africa · DRC · CEMAC", annualFlow: "$4.1B", role: "Africa's largest import sourcing corridor. Guangzhou hosts 200K+ African traders at any time. Yiwu wholesale market. PayRus China wallet settles XAF, CDF, NGN trade payments with Yuan.", color: "text-red-700 bg-red-50 border-red-200" },
  { flag: "🇫🇷", city: "Paris / Lyon", country: "France", region: "Europe", africans: "1.8M+", primaryOrigin: "CEMAC · Maghreb · WAEMU", annualFlow: "$7.8B", role: "PayRus primary Western diaspora market. Largest CEMAC diaspora outside Africa. Paris–Bangui and Paris–Brazzaville are founding corridors. French regulatory framework under ACPR.", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { flag: "🇧🇪", city: "Brussels / Liège", country: "Belgium", region: "Europe", africans: "450K+", primaryOrigin: "DRC · Congo-B · Rwanda", annualFlow: "$2.2B", role: "Largest DRC diaspora in Europe. Brussels–Kinshasa is the world's highest-value Central Africa corridor. Key Phase 2 DRC launch partner city.", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  { flag: "🇬🇧", city: "London", country: "UK", region: "Europe", africans: "750K+", primaryOrigin: "Nigeria · Ghana · Kenya · Somalia", annualFlow: "$5.6B", role: "West Africa and EAC diaspora capital. London–Lagos and London–Nairobi are highest-volume English-speaking corridors. Financial services regulatory model.", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { flag: "🇺🇸", city: "New York / DC / Houston", country: "USA", region: "Americas", africans: "2.0M+", primaryOrigin: "Nigeria · Ethiopia · Ghana · Cameroon", annualFlow: "$12.4B", role: "Largest diaspora remittance origin globally for Sub-Saharan Africa. Nigerian-American, Ethiopian, and Cameroonian communities are high-frequency senders. PayRus USD wallet cross-rail settlement.", color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  { flag: "🇸🇦", city: "Riyadh / Jeddah", country: "Saudi Arabia", region: "Gulf", africans: "600K+", primaryOrigin: "Ethiopia · EAC · CEMAC", annualFlow: "$5.1B", role: "Second Gulf hub. Ethiopian and East African domestic workers dominant. Hajj/Umrah travel corridor drives seasonal spikes. Riyal–ETB/KES settlements are high frequency.", color: "text-green-700 bg-green-50 border-green-200" },
  { flag: "🇪🇹", city: "Addis Ababa", country: "Ethiopia", region: "Africa Hub", africans: "AU Member", primaryOrigin: "Transit hub — all Africa", annualFlow: "Transit", role: "African Union HQ and Ethiopia Airlines global hub. Addis is the #1 African transit city — 80% of intercontinental African travellers connect here. Critical PayRus Travel & Business corridor node.", color: "text-primary bg-primary/10 border-primary/25" },
  { flag: "🇵🇹", city: "Lisbon / Porto", country: "Portugal", region: "Europe", africans: "700K+", primaryOrigin: "Angola · Mozambique · Cape Verde · São Tomé", annualFlow: "$2.8B", role: "Lusophone Africa gateway. Largest Angolan and Mozambican diaspora in Europe. Portugal–Luanda corridor is PayRus Phase 2 Portuguese-language expansion entry point.", color: "text-rose-700 bg-rose-50 border-rose-200" },
  { flag: "🇩🇪", city: "Berlin / Frankfurt", country: "Germany", region: "Europe", africans: "350K+", primaryOrigin: "Cameroon · Nigeria · Namibia", annualFlow: "$1.6B", role: "Growing CEMAC and SADC diaspora. Cameroon–Germany corridor fuelled by students and medical professionals. Frankfurt as European financial hub for PayRus EUR liquidity.", color: "text-gray-700 bg-gray-50 border-gray-200" },
  { flag: "🇮🇳", city: "Mumbai / Delhi", country: "India", region: "Asia", africans: "40K biz travelers", primaryOrigin: "Trade — East + West Africa", annualFlow: "$1.2B", role: "Africa–India trade finance growing 18% YoY. Indian businesses investing in East Africa and CEMAC. Mumbai–Nairobi B2B corridor for goods and services.", color: "text-orange-700 bg-orange-50 border-orange-200" },
  { flag: "🇹🇷", city: "Istanbul", country: "Turkey", region: "Eurasia", africans: "120K+ travelers", primaryOrigin: "Nigeria · Ethiopia · CEMAC", annualFlow: "$1.8B", role: "Africa–Turkey trade accelerating. Turkish Airlines serves 60+ African cities. Istanbul is growing as a transit and trade hub competing with Dubai for African business traffic.", color: "text-teal-700 bg-teal-50 border-teal-200" },
];

const REGIONAL_ORGS = [
  { name: "ECOWAS", members: 15, gdp: "$822B", currency: "ECO (2027)", role: "West Africa single market & monetary union", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { name: "CEMAC", members: 6, gdp: "$103B", currency: "XAF (CFA)", role: "PayRus Home Zone — founded in CAR & Congo-Brazzaville. All 6 CEMAC member states live. Central Africa CFA monetary union.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { name: "EAC", members: 7, gdp: "$312B", currency: "EAC Shilling (plan)", role: "East Africa customs & payments union", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { name: "SADC", members: 16, gdp: "$680B", currency: "Multi-currency", role: "Southern Africa development community", color: "text-violet-700 bg-violet-50 border-violet-200" },
  { name: "AU / AfCFTA", members: 55, gdp: "$3.1T", currency: "Pan-African PAS", role: "Continental free trade — largest single market by nations", color: "text-rose-700 bg-rose-50 border-rose-200" },
  { name: "BCEAO", members: 8, gdp: "$173B", currency: "XOF (CFA)", role: "West Africa CFA central bank — WAEMU zone regulator", color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
];

const INVESTMENT_TIERS = [
  { tier: "Seed Partner", min: "$250K", max: "$1M", equity: "0.5–2%", perks: ["Early API access", "Logo on platform", "Advisory seat"], color: "border-muted-foreground/30" },
  { tier: "Strategic Investor", min: "$1M", max: "$5M", equity: "2–6%", perks: ["White-label product", "Priority corridor allocation", "Board observer"], color: "border-primary/50" },
  { tier: "Anchor Partner", min: "$5M", max: "$25M", equity: "6–15%", perks: ["Co-brand in 3 countries", "Revenue share", "Board seat"], color: "border-accent/50" },
  { tier: "Sovereign Fund", min: "$25M+", max: "Open", equity: "Negotiated", perks: ["National partnership MOU", "Regulatory fast-track", "XAF liquidity pool co-governance"], color: "border-amber-200" },
];

const PROJECTIONS = [
  { year: "2025", users: "12K", tpv: "$8M", revenue: "$0.9M", ebitda: "-$1.2M" },
  { year: "2026", users: "80K", tpv: "$62M", revenue: "$5.4M", ebitda: "-$0.3M" },
  { year: "2027", users: "310K", tpv: "$240M", revenue: "$19M", ebitda: "$4.8M" },
  { year: "2028", users: "900K", tpv: "$720M", revenue: "$55M", ebitda: "$22M" },
  { year: "2029", users: "2.1M", tpv: "$1.8B", revenue: "$130M", ebitda: "$65M" },
  { year: "2030", users: "4.5M", tpv: "$4.2B", revenue: "$290M", ebitda: "$155M" },
];

const PROJ_CHART = PROJECTIONS.map(p => ({
  year: p.year,
  tpv: parseFloat(p.tpv.replace(/[^0-9.]/g, "")) * (p.tpv.includes("B") ? 1000 : 1),
  revenue: parseFloat(p.revenue.replace(/[^0-9.]/g, "")) * (p.revenue.includes("B") ? 1000 : 1),
}));

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────

interface TTProps { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }
function ChartTip({ active, payload, label }: TTProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-bold font-mono">
          {p.name}: {p.value >= 1000 ? `$${(p.value / 1000).toFixed(1)}B` : `$${p.value}M`}
        </p>
      ))}
    </div>
  );
}

// ─── SECTION WRAPPER ─────────────────────────────────────────────────────────

function Section({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className={cn("py-12 px-6 max-w-7xl mx-auto", className)}
    >
      {children}
    </motion.section>
  );
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3">
        {eyebrow}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{title}</h2>
      {sub && <p className="mt-2 text-muted-foreground text-sm max-w-2xl">{sub}</p>}
    </div>
  );
}

function CountryCard({ c, i }: { c: typeof COUNTRIES[number]; i: number }) {
  const level = useCapabilityLevel("country.status", flagToIso(c.flag));
  const borderColor = c.status === "active" ? "border-primary/30" : c.status === "pipeline" ? "border-accent/25" : c.status === "phase3" ? "border-blue-200" : "border-border/60";
  const badgeColor = c.status === "active" && level !== "live" ? "bg-muted/50 border-border text-muted-foreground" : c.status === "active" ? "bg-primary/15 border-primary/30 text-primary" : c.status === "pipeline" ? "bg-accent/15 border-accent/30 text-accent-foreground" : c.status === "phase3" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-muted/50 border-border text-muted-foreground";
  // "● LIVE" now requires a production/enabled row in the capability registry (PRS-BR-013);
  // Phase-1 markets without one read "PHASE 1" rather than claiming to be live.
  const badgeLabel = c.status === "active" ? (level === "live" ? "● LIVE" : "◐ PHASE 1") : c.status === "pipeline" ? "◐ PHASE 2" : c.status === "phase3" ? "◑ PHASE 3" : "○ PHASE 4";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" as const }}
      className={cn("bg-card border rounded-2xl p-4 flex flex-col gap-3", borderColor)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{c.flag}</span>
          <div>
            <h3 className="font-bold text-sm">{c.name}</h3>
            <span className="text-[10px] font-black text-muted-foreground">{c.currency}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border", badgeColor)}>{badgeLabel}</span>
          {c.founding && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">★ FOUNDING</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "Remittances", value: c.remittance },
          { label: "Diaspora", value: c.diaspora },
          { label: "Banked", value: c.banked },
          { label: "Mobile $", value: c.mobile },
        ].map(m => (
          <div key={m.label} className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
            <div className="text-[9px] text-muted-foreground">{m.label}</div>
            <div className="text-xs font-bold font-mono">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/30 rounded-lg px-2.5 py-1.5">
        <MapPin size={10} className="text-primary shrink-0" />
        <span className="font-mono text-[9px]">{c.corridor}</span>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">{c.opportunity}</p>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function InvestorDeck() {
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <PageHeader title={t("investor.pageTitle")} className="mb-4 md:mb-6" />
      </div>

      {/* ── HERO ── */}
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(oklch(0.66 0.20 138) 1px, transparent 1px), linear-gradient(90deg, oklch(0.66 0.20 138) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-accent/8 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("investor.badge")}
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight text-balance mb-4">
            {t("investor.heroTitle1")}<br />
            <span className="text-primary">{t("investor.heroTitle2")}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance mb-8">
            {t("investor.heroDesc")}
          </p>

          {/* Founding markets badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <span className="text-xl">🇨🇫</span>
              <div className="text-left">
                <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{t("investor.foundingMarket")}</div>
                <div className="text-xs font-bold text-foreground">Central African Republic</div>
              </div>
            </div>
            <div className="w-4 h-px bg-amber-400/40 hidden md:block" />
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <span className="text-xl">🇨🇬</span>
              <div className="text-left">
                <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{t("investor.coFoundingMarket")}</div>
                <div className="text-xs font-bold text-foreground">Congo-Brazzaville</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: "CEMAC XAF Zone — 6 Countries Live", value: "$788M", icon: DollarSign },
              { label: "Unbanked Adults in CEMAC", value: "18M+", icon: Users },
              { label: "Avg. Transfer Cost Disrupted", value: "8.2%", icon: TrendingUp },
              { label: "CEMAC Nations Live — Phase 1", value: "6 Nations", icon: Zap },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: "easeOut" as const }}
                className="bg-card/60 border border-border rounded-2xl p-4 backdrop-blur-sm"
              >
                <s.icon size={18} className="text-primary mb-2" />
                <div className="text-2xl font-black font-mono text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── MARKET OPPORTUNITY ── */}
      <Section id="market">
        <SectionHeader
          eyebrow={t("investor.marketOpportunity")}
          title={t("investor.marketTitle")}
          sub={t("investor.marketSub")}
        />
        <div className="grid md:grid-cols-2 gap-6">
          {/* Remittance growth chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Africa Remittance Inflows ($B) — Historical & Projected</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={REMITTANCE_GROWTH}>
                <defs>
                  <linearGradient id="remGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.66 0.20 138)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.66 0.20 138)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="value" name="Remittances" stroke="oklch(0.66 0.20 138)" strokeWidth={2} fill="url(#remGrad)" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Source: World Bank, AfDB, PayRus projections (P)</p>
          </div>

          {/* TAM breakdown */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Total Addressable Market — Segment Mix</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={TAM_BREAKDOWN} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {TAM_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [String(v) + "%", ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {TAM_BREAKDOWN.map(t => (
                <span key={t.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key market facts */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { icon: Globe, title: "Africa ↔ World Corridor", body: "Sub-Saharan Africa has the highest remittance cost globally — averaging 8.2% vs. global average of 6.2%. Every 1% reduction saves recipients $580M per year." },
            { icon: Layers, title: "AfCFTA Unlocks $3.1T", body: "The African Continental Free Trade Area will require a neutral cross-border payment rail. PayRus is architected to be that rail, already compliant in CEMAC and WAEMU zones." },
            { icon: Users, title: "30M+ Diaspora Senders", body: "African diaspora in Europe, North America, and Gulf states send money home monthly. Average transaction: $210. Average frequency: 1.8 times/month." },
          ].map((c, i) => (
            <div key={i} className="bg-card/60 border border-border rounded-2xl p-5">
              <c.icon size={20} className="text-primary mb-3" />
              <h3 className="font-bold text-sm mb-2">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── COUNTRY PROFILES ── */}
      <Section id="countries" className="bg-card/20 rounded-3xl mx-4 my-4">
        <SectionHeader
          eyebrow={t("investor.countryCoverage")}
          title={t("investor.countryTitle")}
          sub={t("investor.countrySub")}
        />

        {/* Phase legend */}
        <div className="flex flex-wrap gap-2.5 mb-7">
          {[
            { label: "Phase 1 — CEMAC (All 6 XAF Live)", color: "bg-primary/15 border-primary/40 text-primary" },
            { label: "Phase 2 — Angola · Namibia · DRC · WAEMU · ECOWAS (2026–27)", color: "bg-accent/15 border-accent/30 text-accent-foreground" },
            { label: "Phase 3 — Full EAC Bloc + Horn of Africa (2027–28)", color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Phase 4 — North Africa · SADC · Egypt (2028+)", color: "bg-muted/60 border-border text-muted-foreground" },
          ].map(s => (
            <span key={s.label} className={cn("text-[10px] font-bold px-3 py-1 rounded-full border", s.color)}>{s.label}</span>
          ))}
        </div>

        {/* Phase 1 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary">Phase 1 — Live</span>
            <div className="flex-1 h-px bg-primary/20" />
            <span className="text-[10px] text-muted-foreground font-mono">6 countries · XAF · CEMAC</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {COUNTRIES.filter(c => c.phase === 1).map((c, i) => (
              <CountryCard key={c.name} c={c} i={i} />
            ))}
          </div>
        </div>

        {/* Phase 2 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent-foreground">Phase 2 — Pipeline (2026–27)</span>
            <div className="flex-1 h-px bg-accent/20" />
            <span className="text-[10px] text-muted-foreground font-mono">8 countries · AOA · CDF · XOF · NGN · GHS · NAD</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {COUNTRIES.filter(c => c.phase === 2).map((c, i) => (
              <CountryCard key={c.name} c={c} i={i} />
            ))}
          </div>
        </div>

        {/* Phase 3 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">Phase 3 — Full EAC Bloc + Horn (2027–28)</span>
            <div className="flex-1 h-px bg-blue-400/20" />
            <span className="text-[10px] text-muted-foreground font-mono">8 countries · KES · TZS · UGX · RWF · BIF · ETB · SSP · DJF</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {COUNTRIES.filter(c => c.phase === 3).map((c, i) => (
              <CountryCard key={c.name} c={c} i={i} />
            ))}
          </div>
        </div>

        {/* Phase 4 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground">Phase 4 — North/South Africa (2028+)</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-mono">5 countries · MAD · ZAR · EGP · ZMW · MZN</span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {COUNTRIES.filter(c => c.phase === 4).map((c, i) => (
              <CountryCard key={c.name} c={c} i={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── GLOBAL DIASPORA CORRIDORS ── */}
      <Section id="diaspora">
        <SectionHeader
          eyebrow={t("investor.diasporaStrategy")}
          title={t("investor.diasporaTitle")}
          sub={t("investor.diasporaSub")}
        />

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Diaspora Hubs", value: "12", sub: "cities & regions covered" },
            { label: "Total Flow/yr", value: "$55.8B", sub: "combined annual remittance" },
            { label: "Africans Abroad", value: "9M+", sub: "in target diaspora hubs" },
            { label: "Corridors", value: "40+", sub: "bilateral payment pairs" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="text-xl font-black font-mono text-primary">{s.value}</div>
              <div className="text-[11px] font-bold text-foreground mt-0.5">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DIASPORA_HUBS.map((h, i) => (
            <motion.div
              key={h.city}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" as const }}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{h.flag}</span>
                  <div>
                    <h3 className="font-bold text-sm">{h.city}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{h.country}</span>
                      <span className="text-[10px] text-border">·</span>
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border", h.color)}>{h.region}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-foreground">{h.annualFlow !== "Transit" ? h.annualFlow : "—"}</div>
                  <div className="text-[9px] text-muted-foreground">{h.annualFlow !== "Transit" ? "annual flow" : "transit hub"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
                  <div className="text-[9px] text-muted-foreground">Africans Present</div>
                  <div className="text-xs font-bold font-mono">{h.africans}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
                  <div className="text-[9px] text-muted-foreground">Origin Communities</div>
                  <div className="text-[10px] font-bold leading-tight">{h.primaryOrigin}</div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">{h.role}</p>
            </motion.div>
          ))}
        </div>

        {/* Travel corridors note */}
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Globe size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-sm mb-1">Beyond Diaspora — Business Travel & Holiday Corridors</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                Africans travel for business to Dubai (electronics sourcing), China (wholesale), Turkey (textiles), India (trade finance), and Europe (services). PayRus Travel Wallet ensures zero-friction FX at every destination — the same account used in Kinshasa works at a Dubai souk, a Guangzhou trade fair, or a Paris business meeting.
              </p>
              <div className="flex flex-wrap gap-2">
                {["🇦🇪 Dubai — Trade Hub", "🇨🇳 Guangzhou — Wholesale", "🇹🇷 Istanbul — Textiles", "🇮🇳 Mumbai — Finance", "🇫🇷 Paris — Diaspora", "🇧🇪 Brussels — DRC Gateway", "🇸🇦 Mecca — Hajj Season", "🇬🇧 London — Anglophone Hub", "🇺🇸 New York — Americas Diaspora", "🇪🇹 Addis — Transit Hub"].map(tag => (
                  <span key={tag} className="text-[10px] bg-secondary border border-border px-2.5 py-1 rounded-lg text-muted-foreground font-mono">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── REGIONAL ORGANISATIONS ── */}
      <Section id="orgs">
        <SectionHeader
          eyebrow={t("investor.regionalPartners")}
          title={t("investor.regionalTitle")}
          sub={t("investor.regionalSub")}
        />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {REGIONAL_ORGS.map((org, i) => (
            <motion.div
              key={org.name}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" as const }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={cn("text-xs font-black px-2.5 py-1 rounded-lg border", org.color)}>{org.name}</span>
                  <div className="mt-2 text-[11px] font-mono font-bold text-foreground">{org.currency}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-foreground">{org.members} members</div>
                  <div className="text-[10px] text-muted-foreground">GDP: {org.gdp}</div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{org.role}</p>
              <div className="mt-3 flex items-center gap-1 text-[10px] text-primary font-semibold">
                <Landmark size={11} />
                Regulatory roadmap available
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── FINANCIAL PROJECTIONS ── */}
      <Section id="projections" className="bg-card/20 rounded-3xl mx-4 my-4">
        <SectionHeader
          eyebrow={t("investor.projections")}
          title={t("investor.projectionsTitle")}
          sub={t("investor.projectionsSub")}
        />

        {/* Projection table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["Year", "Active Users", "TPV", "Revenue", "EBITDA"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROJECTIONS.map((p, i) => (
                <tr key={p.year} className={cn("border-b border-border/50 transition-colors", i >= 2 && "bg-primary/5")}>
                  <td className="py-2.5 px-3 font-black font-mono text-foreground">{p.year}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{p.users}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{p.tpv}</td>
                  <td className="py-2.5 px-3 font-mono text-primary font-bold">{p.revenue}</td>
                  <td className={cn("py-2.5 px-3 font-mono font-bold", p.ebitda.startsWith("-") ? "text-destructive" : "text-emerald-700")}>{p.ebitda}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-2 px-3">* Conservative scenario. Assumes 1.5% take rate, 35% YoY user growth post-Phase 2. Sensitivity analysis available on request.</p>
        </div>

        {/* TPV/Revenue chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">TPV vs Revenue ($M) — 2025–2030</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PROJ_CHART} barCategoryGap="30%">
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `$${v/1000}B` : `$${v}M`} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="tpv" name="TPV" fill="oklch(0.65 0.17 218)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue" fill="oklch(0.66 0.20 138)" radius={[4, 4, 0, 0]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── VALUE PROPOSITION ── */}
      <Section id="value">
        <SectionHeader
          eyebrow={t("investor.valueProposition")}
          title={t("investor.valueTitle")}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {/* Investors */}
          <div className="bg-card border border-primary/25 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary" />
              <h3 className="font-black text-sm">Investors</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "All 6 CEMAC XAF nations fully live — founded in CAR & Congo-Brazzaville, the most financially excluded markets in Central Africa",
                "High-growth fintech in the world's fastest-growing mobile-first region",
                "Network-effect moat: each country added multiplies corridor pairs",
                "Regulated infrastructure — not speculative crypto",
                "Exit via IPO (Nairobi, Lagos, Paris) or strategic acquisition by Visa/Mastercard/MTN",
                "Projected 8–12× return on seed-round entry by 2029",
              ].map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CheckCircle size={12} className="text-primary mt-0.5 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          {/* Country decision-makers */}
          <div className="bg-card border border-accent/25 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Landmark size={18} className="text-accent-foreground" />
              <h3 className="font-black text-sm">Country Decision-Makers</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Increase GDP contribution of diaspora remittances by reducing friction costs",
                "Formalise informal transfer channels — grow fiscal visibility",
                "Enable cross-border government salary, pension & subsidy disbursements",
                "Integration with national mobile money operators (Orange, MTN, Wave)",
                "Sovereign data governance — no data leaves the regulatory zone",
                "G2P payments at sub-1% cost vs. current 4–8% average",
              ].map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CheckCircle size={12} className="text-accent-foreground mt-0.5 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          {/* Banking partners */}
          <div className="bg-card border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-amber-700" />
              <h3 className="font-black text-sm">Banking Partners</h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Instant access to 30M+ diaspora customers without acquisition cost",
                "FX liquidity pool across CDF, XAF, XOF, NGN, KES corridors",
                "White-label remittance product for existing retail client base",
                "API-first integration — plug into PayRus rails without core banking rebuild",
                "Regulatory pre-clearance in CEMAC, WAEMU, and ECOWAS zones",
                "Revenue share on corridor transaction volume from Day 1",
              ].map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <CheckCircle size={12} className="text-amber-700 mt-0.5 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── INVESTMENT TIERS ── */}
      <Section id="invest" className="bg-card/20 rounded-3xl mx-4 my-4">
        <SectionHeader
          eyebrow={t("investor.partnership")}
          title={t("investor.partnershipTitle")}
          sub={t("investor.partnershipSub")}
        />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {INVESTMENT_TIERS.map((t, i) => (
            <motion.div
              key={t.tier}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" as const }}
              className={cn("bg-card border rounded-2xl p-5 flex flex-col gap-3", t.color)}
            >
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Tier {i + 1}</div>
                <div className="font-black text-base text-foreground mt-0.5">{t.tier}</div>
              </div>
              <div className="bg-secondary/60 rounded-xl px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Ticket Size</div>
                <div className="font-black font-mono text-sm">{t.min}{t.max !== "Open" ? ` – ${t.max}` : "+"}</div>
              </div>
              <div className="bg-secondary/60 rounded-xl px-3 py-2">
                <div className="text-[10px] text-muted-foreground">Equity</div>
                <div className="font-black font-mono text-sm text-primary">{t.equity}</div>
              </div>
              <div className="space-y-1.5 mt-auto">
                {t.perks.map(p => (
                  <div key={p} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Award size={10} className="text-primary shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── COMPETITIVE EDGE ── */}
      <Section id="edge">
        <SectionHeader
          eyebrow={t("investor.competitive")}
          title={t("investor.competitiveTitle")}
        />
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Shield, title: "Regulatory-First Architecture", body: "Built for CEMAC central bank frameworks (BEAC) from day one, with CAR and Congo-Brazzaville central bank licences as the regulatory baseline. All 6 CEMAC member states are operationally live. This unlocks institutional trust and government partnership at continental scale." },
            { icon: Layers, title: "Multi-Rail Settlement", body: "PayRus runs on mobile money, SWIFT, card rails, and proprietary African interbank networks simultaneously — ensuring 99.4% delivery success rate even in low-connectivity regions like CAR." },
            { icon: Globe, title: "XAF-Native Liquidity Pools", body: "Pre-funded XAF liquidity across all 6 CEMAC nations ensures instant settlement at the BEAC fixed rate. Secondary pools in XOF, NGN, KES and CDF for Phase 2 expansion." },
            { icon: Target, title: "B2C × B2B × G2P in One Platform", body: "Most competitors serve only one segment. PayRus unifies retail diaspora transfers, SME trade payments, and government disbursements in one compliance-cleared CEMAC-native platform." },
            { icon: Zap, title: "Sub-5-Second Settlement", body: "Proprietary routing engine achieves median transfer time of 4.3 seconds vs. 2–5 days for legacy SWIFT corridors and 15–45 minutes for MTN/Orange Money cross-border flows." },
            { icon: BarChart2, title: "Data-as-a-Revenue Layer", body: "Aggregated, anonymised CEMAC payment intelligence is licensed to BEAC, AfDB, and commercial banks as real-time economic indicators — creating a €4M ARR data revenue stream by 2028." },
          ].map((c, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 flex gap-4">
              <c.icon size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm mb-1">{c.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section id="contact">
        <div className="relative bg-card border border-primary/25 rounded-3xl overflow-hidden p-8 md:p-12 text-center">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(oklch(0.66 0.20 138) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("investor.ctaBadge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-balance">
              {t("investor.ctaTitle")} <span className="text-primary">{t("investor.ctaTitleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-balance text-sm">
              {t("investor.ctaDesc")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href={`mailto:partnerships@payrus.finance?subject=${encodeURIComponent(t("investor.requestDeck"))}`} className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm cursor-pointer">
                {t("investor.requestDeck")}
                <ArrowUpRight size={16} />
              </a>
              <a href={`mailto:partnerships@payrus.finance?subject=${encodeURIComponent(t("investor.scheduleCall"))}`} className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-6 py-3 rounded-xl hover:bg-secondary/80 transition-colors text-sm cursor-pointer">
                {t("investor.scheduleCall")}
                <ChevronRight size={16} />
              </a>
            </div>
            <p className="mt-6 text-[10px] text-muted-foreground">
              Contact: partnerships@payrus.finance · Bangui · Brazzaville · Brussels · Dakar
            </p>
          </div>
        </div>
      </Section>

      {/* Bottom padding */}
      <div className="h-12" />
    </div>
  );
}
