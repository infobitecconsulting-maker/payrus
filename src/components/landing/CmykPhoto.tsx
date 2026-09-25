import { useEffect } from "react";

import { mountPressPlates } from "@/lib/press-plates";
import { cn } from "@/lib/utils";

interface CmykPhotoProps {
  src: string;
  alt: string;
  credit?: string;
  creditHref?: string;
  aspectRatio: string;
  className?: string;
}

/**
 * A photograph printed as its four misregistered CMYK process plates
 * (the Broadsheet design system's showcase treatment). Hover resolves
 * the plates into register and purifies the inks back to the source
 * photograph. See src/lib/press-plates.ts for the mechanism.
 */
export function CmykPhoto({
  src,
  alt,
  credit,
  creditHref,
  aspectRatio,
  className,
}: CmykPhotoProps) {
  useEffect(() => {
    const stop = mountPressPlates();
    return stop;
  }, []);

  return (
    <figure className={cn("cmyk", className)}>
      <div className="print" style={{ aspectRatio }}>
        <img src={src} alt={alt} loading="lazy" />
        {credit && (
          <a
            className="cmyk-credit"
            href={creditHref}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
          >
            {credit}
          </a>
        )}
      </div>
    </figure>
  );
}
