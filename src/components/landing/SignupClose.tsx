import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  closeTitle,
  closeBody,
  signupLabel,
  signupPlaceholder,
  signupCta,
  signupNote,
  signupMailto,
} from "@/data/payrus-landing-content";

export function SignupClose() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = encodeURIComponent("PayRus account request");
    const body = encodeURIComponent(
      email
        ? `Please open a PayRus account for: ${email}`
        : "Please open a PayRus account for me.",
    );
    window.location.href = `mailto:${signupMailto}?subject=${subject}&body=${body}`;
  };

  return (
    <div id="signin" className="scroll-mt-6 bg-pr-navy-100">
      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="grid grid-cols-1 items-end gap-8 pr:grid-cols-[1.35fr_1fr]">
          <div>
            <h2 className="max-w-[20em]" style={{ textWrap: "pretty" }}>
              {closeTitle}
            </h2>
            <p className="mt-4 max-w-[36em] text-[17px] leading-[1.6] text-pr-navy-800">
              {closeBody}
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="pr-signup"
                className="mb-[5px] block text-xs text-foreground/70"
              >
                {signupLabel}
              </label>
              <Input
                id="pr-signup"
                type="email"
                placeholder={signupPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="submit">{signupCta}</Button>
              <span className="text-[13px] text-pr-navy-800">{signupNote}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
