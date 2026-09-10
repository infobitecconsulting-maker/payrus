import {
  footerLeft,
  footerRight,
  footerCredit,
} from "@/data/payrus-landing-content";

export function Footer() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pt-6 pb-8">
      <div className="h-px bg-foreground" />
      <div className="flex flex-wrap items-baseline justify-between gap-4 pt-4 text-[13px] text-pr-neutral-600">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
      <div className="mt-2 max-w-[52em] text-xs leading-[1.5] text-pr-neutral-600">
        {footerCredit}
      </div>
    </div>
  );
}
