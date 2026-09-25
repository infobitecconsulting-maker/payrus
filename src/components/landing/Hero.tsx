import { Button } from "@/components/ui/button";
import {
  heroTitle,
  heroBody,
  heroFacts,
  ctaLabel,
  ctaSecondary,
  ctaNote,
} from "@/data/payrus-landing-content";

export function Hero() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 py-8">
      <div className="grid grid-cols-1 items-end gap-8 pr:grid-cols-[1.35fr_1fr]">
        <div>
          <h1
            className="m-0 max-w-[16em] leading-[1.02] tracking-[-0.03em]"
            style={{ fontSize: "clamp(44px, 6.4vw, 84px)", textWrap: "pretty" }}
          >
            {heroTitle}
          </h1>
          <p
            className="mt-6 mb-0 max-w-[34em] text-xl text-pr-neutral-700 leading-[1.6]"
            style={{ textWrap: "pretty" }}
          >
            {heroBody}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <a href="#signin">{ctaLabel}</a>
            </Button>
            <Button asChild variant="secondary">
              <a href="#signin">{ctaSecondary}</a>
            </Button>
            <span className="text-[13px] text-pr-neutral-600">{ctaNote}</span>
          </div>
        </div>
        <div>
          {heroFacts.map((f) => (
            <div key={f.label} className="pb-4">
              <div className="font-heading text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums">
                {f.figure}
              </div>
              <div className="mt-[2px] text-[15px] leading-normal text-pr-neutral-700">
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
