import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Search, ShieldCheck, Sparkles, Wallet, CreditCard, Save, X, Plus,
  Trash2, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { AppUserRole, AdminUserRow } from "@/lib/backend.ts";
import {
  useAdminListUsers, useAdminUpdateUserRoleMutation, useAdminCreateUserMutation,
  useAdminGrantAdminRoleMutation, useTestUsersCleanupMutation,
} from "@/hooks/use-backend.ts";

const ALL_ROLES = [
  "personal", "merchant", "agent", "treasury", "public_institution",
  "ngo", "group", "starter", "admin",
] as const;

type Role = AppUserRole;
type UserRow = AdminUserRow;

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
    verified: { icon: CheckCircle2, cls: "bg-primary/10 text-primary" },
    pending_verification: { icon: Clock, cls: "bg-amber-100 text-amber-700" },
    incomplete: { icon: AlertCircle, cls: "bg-destructive/10 text-destructive" },
  };
  const m = map[status] ?? map.incomplete;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", m.cls)}>
      <Icon size={9} />{status.replace("_", " ")}
    </span>
  );
}

function EditRoleForm({ row, roleId, onDone }: { row: UserRow; roleId: string; onDone: () => void }) {
  const role = row.roles.find((r) => r.id === roleId)!;
  const updateUserRole = useAdminUpdateUserRoleMutation();
  const [status, setStatus] = useState(role.status);
  const [phone, setPhone] = useState(role.phone ?? "");
  const [address, setAddress] = useState(role.address ?? "");
  const [orgName, setOrgName] = useState(role.orgName ?? "");
  const [legalRepName, setLegalRepName] = useState(role.legalRepName ?? "");
  const [legalRepIdNumber, setLegalRepIdNumber] = useState(role.legalRepIdNumber ?? "");
  const [legalRepPhone, setLegalRepPhone] = useState(role.legalRepPhone ?? "");
  const [saving, setSaving] = useState(false);

  const isOrg = role.kind === "organisation";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserRole({
        roleId,
        status: status as "incomplete" | "pending_verification" | "verified",
        phone, address,
        ...(isOrg ? { orgName, legalRepName, legalRepIdNumber, legalRepPhone } : {}),
      });
      toast.success("Profile updated");
      onDone();
    } catch {
      toast.error("Couldn't save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-secondary/40 rounded-xl p-3 mt-2 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs">
            <option value="incomplete">Incomplete</option>
            <option value="pending_verification">Pending verification</option>
            <option value="verified">Verified</option>
          </select>
        </label>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase">
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
        </label>
        <label className="text-[10px] text-muted-foreground font-semibold uppercase col-span-2">
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
        </label>
        {isOrg && (
          <>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase col-span-2">
              Organisation name
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
            </label>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase">
              Legal rep. name
              <input value={legalRepName} onChange={(e) => setLegalRepName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
            </label>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase">
              Legal rep. ID number
              <input value={legalRepIdNumber} onChange={(e) => setLegalRepIdNumber(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
            </label>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase col-span-2">
              Legal rep. phone
              <input value={legalRepPhone} onChange={(e) => setLegalRepPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs" />
            </label>
          </>
        )}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onDone} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer">
          <X size={12} /> Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground cursor-pointer disabled:opacity-60">
          <Save size={12} /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function CreateProfileForm({ onDone }: { onDone: () => void }) {
  const createUser = useAdminCreateUserMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ALL_ROLES)[number]>("personal");
  const [kind, setKind] = useState<"individual" | "organisation">("individual");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdminRole = role === "admin";

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (isAdminRole && !password) {
      toast.error("The admin role requires the admin password");
      return;
    }
    setSaving(true);
    try {
      const result = await createUser({
        name: name.trim(), email: email.trim().toLowerCase(), role, kind,
        ...(isAdminRole ? { password } : {}),
      });
      toast.success(result.alreadyExisted ? "That role already existed for this email" : "Profile created");
      onDone();
    } catch {
      toast.error(isAdminRole ? "Incorrect admin password" : "Couldn't create this profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Full name / organisation name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs col-span-2" />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs col-span-2" />
        <select value={role} onChange={(e) => setRole(e.target.value as (typeof ALL_ROLES)[number])} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as "individual" | "organisation")} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
          <option value="individual">Individual</option>
          <option value="organisation">Organisation</option>
        </select>
        {isAdminRole && (
          <input
            placeholder="Admin password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs col-span-2"
          />
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer">Cancel</button>
        <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground cursor-pointer disabled:opacity-60">
          <Plus size={12} /> {saving ? "Creating..." : "Create profile"}
        </button>
      </div>
    </motion.div>
  );
}

export default function UsersPanel() {
  const rows = useAdminListUsers();
  const grantAdminRole = useAdminGrantAdminRoleMutation();
  const cleanup = useTestUsersCleanupMutation();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const filtered = (rows ?? []).filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      row.user.name?.toLowerCase().includes(q) ||
      row.user.email?.toLowerCase().includes(q) ||
      row.roles.some((r) => r.role.toLowerCase().includes(q))
    );
  });

  const handleCleanup = async () => {
    const deletedCount = await cleanup();
    toast.success(`Removed ${deletedCount} test profile(s)`);
  };

  const handleMakeAdmin = async (userId: string) => {
    const password = window.prompt("Enter the admin password to grant this role:");
    if (password === null) return;
    try {
      await grantAdminRole({ userId, password });
      toast.success("Granted admin role");
    } catch {
      toast.error("Incorrect admin password");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or role..."
            className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-2 text-xs"
          />
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
        >
          <Plus size={13} /> Add profile
        </button>
        <button
          onClick={() => void handleCleanup()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold cursor-pointer hover:bg-destructive/5"
        >
          <Trash2 size={13} /> Clean up test data
        </button>
      </div>

      {creating && <CreateProfileForm onDone={() => setCreating(false)} />}

      {rows === undefined && (
        <div className="text-xs text-muted-foreground text-center py-8">Loading users...</div>
      )}
      {rows && filtered.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-8">No users match your search.</div>
      )}

      <div className="space-y-3">
        {filtered.map((row) => {
          const totalBalance = row.wallets.reduce((sum, w) => sum + w.balance, 0);
          const primaryCard = row.cards[0];
          return (
            <div key={row.user.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{row.user.name ?? "—"}</span>
                    {row.user.isTestData && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                        <Sparkles size={9} /> Test
                      </span>
                    )}
                    {row.roles.some((r) => r.role === "admin") && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-1">
                        <ShieldCheck size={9} /> Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{row.user.email ?? "no email"}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                      <Wallet size={11} className="text-muted-foreground" /> {row.wallets.length} · {totalBalance.toLocaleString()}
                    </div>
                    {primaryCard && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground justify-end">
                        <CreditCard size={11} /> {primaryCard.brand} •• {primaryCard.last4}
                      </div>
                    )}
                  </div>
                  {!row.roles.some((r) => r.role === "admin") && (
                    <button
                      onClick={() => void handleMakeAdmin(row.user.id)}
                      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary cursor-pointer whitespace-nowrap"
                    >
                      Make admin
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {row.roles.map((role) => (
                  <div key={role.id}>
                    <div className="flex items-center justify-between gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold capitalize">{role.role.replace("_", " ")}</span>
                        <StatusPill status={role.status} />
                        <span className="text-[10px] text-muted-foreground">{role.kind}</span>
                      </div>
                      <button
                        onClick={() => setEditingRoleId(editingRoleId === role.id ? null : role.id)}
                        className="text-[10px] font-semibold text-primary cursor-pointer shrink-0"
                      >
                        {editingRoleId === role.id ? "Close" : "Edit"}
                      </button>
                    </div>
                    {editingRoleId === role.id && (
                      <EditRoleForm row={row} roleId={role.id} onDone={() => setEditingRoleId(null)} />
                    )}
                  </div>
                ))}
                {row.roles.length === 0 && (
                  <div className="text-[11px] text-muted-foreground italic px-1">No roles activated yet.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
