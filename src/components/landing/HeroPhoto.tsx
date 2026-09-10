import { CmykPhoto } from "@/components/landing/CmykPhoto";
import { heroPhoto, photoCaption } from "@/data/payrus-landing-content";

export function HeroPhoto() {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-8">
      <CmykPhoto
        src={heroPhoto.src}
        alt={heroPhoto.alt}
        credit={heroPhoto.credit}
        creditHref={heroPhoto.creditHref}
        aspectRatio="21 / 9"
      />
      <div className="mt-2 text-[13px] text-pr-neutral-600">{photoCaption}</div>
    </div>
  );
}
