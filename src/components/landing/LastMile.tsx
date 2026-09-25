import { CmykPhoto } from "@/components/landing/CmykPhoto";
import {
  lastMileTitle,
  lastMileBody,
  lastMilePoints,
  lastMilePhoto,
} from "@/data/payrus-landing-content";

export function LastMile() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-8">
      <div className="grid grid-cols-1 items-end gap-8 pr:grid-cols-[1.35fr_1fr]">
        <div>
          <h2 className="max-w-[22em]" style={{ textWrap: "pretty" }}>
            {lastMileTitle}
          </h2>
          <p
            className="mt-4 max-w-[34em] text-[17px] leading-[1.6] text-pr-neutral-700"
            style={{ textWrap: "pretty" }}
          >
            {lastMileBody}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {lastMilePoints.map((p) => (
              <div key={p.text} className="flex items-baseline gap-3">
                <span className="size-[7px] shrink-0 rounded-full bg-accent" />
                <span className="text-base leading-[1.55]">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <CmykPhoto
          src={lastMilePhoto.src}
          alt={lastMilePhoto.alt}
          credit={lastMilePhoto.credit}
          creditHref={lastMilePhoto.creditHref}
          aspectRatio="4 / 5"
        />
      </div>
    </div>
  );
}
