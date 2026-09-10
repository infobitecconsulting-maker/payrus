import { corridors } from "@/data/payrus-landing-content";

export function Corridors() {
  return (
    <div
      id="corridors"
      className="mx-auto max-w-[1180px] scroll-mt-6 px-6 pb-8"
    >
      <div
        className="grid gap-x-6 gap-y-8"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        {corridors.map((c) => (
          <div key={c.code}>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[26px] font-semibold tracking-[0.02em]">
                {c.code}
              </span>
              <span className="inline-flex items-center rounded-sm border border-primary px-2 py-[3px] text-[11px] tracking-[0.02em] text-primary">
                {c.tag}
              </span>
            </div>
            <div className="mt-2 text-[15px] leading-[1.55] text-pr-neutral-700">
              {c.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
