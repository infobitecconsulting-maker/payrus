import { cn } from "@/lib/utils";
import {
  rolesTitle,
  rolesBody,
  rolesCols,
  roles,
  type RoleRow,
} from "@/data/payrus-landing-content";

const tagClasses: Record<RoleRow["cls"], string> = {
  "tag-live": "bg-pr-green-100 text-pr-green-800",
  "tag-pilot": "border border-primary text-primary",
  "tag-open": "bg-pr-neutral-100 text-pr-neutral-800",
};

export function Roles() {
  return (
    <div id="roles" className="mx-auto max-w-[1180px] scroll-mt-6 px-6 pb-8">
      <h2 className="mb-2 max-w-[24em]" style={{ textWrap: "pretty" }}>
        {rolesTitle}
      </h2>
      <p className="mb-6 max-w-[40em] text-[17px] leading-[1.6] text-pr-neutral-700">
        {rolesBody}
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-border p-2 text-left text-[11px] tracking-[0.08em] text-foreground/60 uppercase">
              {rolesCols[0]}
            </th>
            <th className="border-b border-border p-2 text-left text-[11px] tracking-[0.08em] text-foreground/60 uppercase">
              {rolesCols[1]}
            </th>
            <th className="border-b border-border p-2 text-right text-[11px] tracking-[0.08em] text-foreground/60 uppercase">
              {rolesCols[2]}
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.name} className="hover:bg-foreground/[0.04]">
              <td className="border-b border-foreground/[0.08] p-2 font-semibold whitespace-nowrap">
                {r.name}
              </td>
              <td className="border-b border-foreground/[0.08] p-2">
                {r.does}
              </td>
              <td className="border-b border-foreground/[0.08] p-2 text-right whitespace-nowrap">
                <span
                  className={cn(
                    "inline-flex items-center rounded-sm px-2 py-[3px] text-[11px] tracking-[0.02em]",
                    tagClasses[r.cls],
                  )}
                >
                  {r.badge}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
