import { railsTitle, rails } from "@/data/payrus-landing-content";

export function Rails() {
  return (
    <div id="rails" className="mx-auto max-w-[1180px] scroll-mt-6 px-6 pb-8">
      <h2 className="mb-6 max-w-[24em]" style={{ textWrap: "pretty" }}>
        {railsTitle}
      </h2>
      <div
        className="grid gap-x-6 gap-y-8"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        {rails.map((r) => (
          <div key={r.title}>
            <div className="text-[13px] tracking-[0.16em] text-pr-neutral-600 uppercase">
              {r.kicker}
            </div>
            <h4 className="my-2">{r.title}</h4>
            <p
              className="m-0 text-base leading-[1.6] text-pr-neutral-700"
              style={{ textWrap: "pretty" }}
            >
              {r.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
