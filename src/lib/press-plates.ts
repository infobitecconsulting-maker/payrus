// Ported from the Broadsheet design system's print-plates.js
// (project/_ds/broadsheet-.../_ds_bundle.js in the Claude Design handoff).
// Mounts the CMYK separation SVG filter defs once, then drives the hover
// "press" animation: on hover over any `.cmyk .print` element, the four
// process plates (C/M/Y/K) gather into register and their inks ease from
// the brand separation to the pure-process factorization that multiplies
// back to the exact source image, while a global pointer lean
// (--press-nx/--press-ny) nudges the moving plates toward the cursor.
// Stands down under prefers-reduced-motion or without a fine hover pointer.

const ID = "payrus-press-plates";

type Vec5 = [number, number, number, number, number];
type Matrix20 = [...Vec5, ...Vec5, ...Vec5, ...Vec5];
type Plate = "c" | "m" | "y" | "k";

function injectDefs(): SVGSVGElement {
  const existing = document.getElementById(ID) as SVGSVGElement | null;
  if (existing) return existing;

  const host = document.createElement("div");
  host.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="sep-all" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0.467 0 0 0 0.533  0.310 0 0 0 0.690  0 0 0 0 1" data-plate-mat="c" result="c0"/>
    <feComposite in="c0" in2="SourceAlpha" operator="in" result="c"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0.161 0 0 0.839  0 1 0 0 0  0 0.576 0 0 0.424  0 0 0 0 1" data-plate-mat="m" result="m0"/>
    <feComposite in="m0" in2="SourceAlpha" operator="in" result="m1"/>
    <feOffset in="m1" dx="5" dy="3" data-plate="m" result="m"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0.071 0 0.929  0 0 0.267 0 0.733  0 0 1 0 0  0 0 0 0 1" data-plate-mat="y" result="y0"/>
    <feComposite in="y0" in2="SourceAlpha" operator="in" result="y1"/>
    <feOffset in="y1" dx="-5" dy="-3" data-plate="y" result="y"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0.112 0.375 0.038 0 0.475  0.113 0.379 0.038 0 0.471  0.113 0.380 0.038 0 0.468  0 0 0 0 1" data-plate-mat="k" result="k0"/>
    <feComposite in="k0" in2="SourceAlpha" operator="in" result="k1"/>
    <feOffset in="k1" dx="3" dy="6" data-plate="k" result="k"/>
    <feBlend in="m" in2="c" mode="multiply" result="s1"/>
    <feBlend in="y" in2="s1" mode="multiply" result="s2"/>
    <feBlend in="k" in2="s2" mode="multiply"/>
  </filter>
</defs></svg>`;
  const svg = host.firstChild as SVGSVGElement;
  svg.id = ID;
  document.body.appendChild(svg);
  return svg;
}

function startPressDriver(svg: SVGSVGElement): () => void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches)
    return () => {};

  const BASE: Record<"m" | "y" | "k", [number, number]> = {
    m: [5, 3],
    y: [-5, -3],
    k: [3, 6],
  };
  const LEAN_PX: [number, number] = [2.5, 2];
  const REGISTER_MS = 450;

  const nodes: Partial<Record<"m" | "y" | "k", SVGFEOffsetElement>> = {};
  svg
    .querySelectorAll<SVGFEOffsetElement>("feOffset[data-plate]")
    .forEach((n) => {
      nodes[n.dataset.plate as "m" | "y" | "k"] = n;
    });
  const mats: Partial<Record<Plate, SVGFEColorMatrixElement>> = {};
  svg
    .querySelectorAll<SVGFEColorMatrixElement>("feColorMatrix[data-plate-mat]")
    .forEach((n) => {
      mats[n.dataset.plateMat as Plate] = n;
    });

  const INK: Record<Plate, Matrix20> = {
    c: [
      1, 0, 0, 0, 0, 0.467, 0, 0, 0, 0.533, 0.31, 0, 0, 0, 0.69, 0, 0, 0, 0, 1,
    ],
    m: [
      0, 0.161, 0, 0, 0.839, 0, 1, 0, 0, 0, 0, 0.576, 0, 0, 0.424, 0, 0, 0, 0,
      1,
    ],
    y: [
      0, 0, 0.071, 0, 0.929, 0, 0, 0.267, 0, 0.733, 0, 0, 1, 0, 0, 0, 0, 0, 0,
      1,
    ],
    k: [
      0.112, 0.375, 0.038, 0, 0.475, 0.113, 0.379, 0.038, 0, 0.471, 0.113, 0.38,
      0.038, 0, 0.468, 0, 0, 0, 0, 1,
    ],
  };
  const TRUE_: Record<Plate, Matrix20> = {
    c: [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    m: [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    y: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    k: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  };

  const root = document.documentElement;
  let nx = 0,
    ny = 0;
  let tx = 0,
    ty = 0;
  let reg = 1;
  let regFrom = 1,
    regTo = 1,
    regT0 = 0;
  let raf = 0,
    lastOffs = "",
    lastReg = -1,
    lastProps = "";
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  const tick = (now: number) => {
    raf = 0;
    nx += (tx - nx) * 0.22;
    ny += (ty - ny) * 0.22;
    if (regTo !== reg || regT0) {
      const t = Math.min(1, (now - regT0) / REGISTER_MS);
      reg = regFrom + (regTo - regFrom) * ease(t);
      if (t >= 1) {
        reg = regTo;
        regT0 = 0;
      }
    }
    const lx = LEAN_PX[0] * nx,
      ly = LEAN_PX[1] * ny;
    const vals: Partial<Record<"m" | "y" | "k", [string, string]>> = {};
    let offsKey = "";
    for (const p of ["m", "y", "k"] as const) {
      const dx = ((BASE[p][0] + lx) * reg).toFixed(2);
      const dy = ((BASE[p][1] + ly) * reg).toFixed(2);
      vals[p] = [dx, dy];
      offsKey += dx + "," + dy + ";";
    }
    if (offsKey !== lastOffs) {
      lastOffs = offsKey;
      for (const p of ["m", "y", "k"] as const) {
        nodes[p]?.setAttribute("dx", vals[p]![0]);
        nodes[p]?.setAttribute("dy", vals[p]![1]);
      }
    }
    if (reg !== lastReg) {
      lastReg = reg;
      for (const p of ["c", "m", "y", "k"] as const) {
        const a = INK[p],
          b = TRUE_[p];
        const v = a.map((val, i) => (b[i] + (val - b[i]) * reg).toFixed(3));
        mats[p]?.setAttribute("values", v.join(" "));
      }
    }
    const pk = nx.toFixed(3) + "," + ny.toFixed(3);
    if (pk !== lastProps) {
      lastProps = pk;
      root.style.setProperty("--press-nx", nx.toFixed(3));
      root.style.setProperty("--press-ny", ny.toFixed(3));
    }
    if (regT0 || Math.abs(tx - nx) > 0.002 || Math.abs(ty - ny) > 0.002)
      schedule();
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent) => {
    tx = (2 * e.clientX) / innerWidth - 1;
    ty = (2 * e.clientY) / innerHeight - 1;
    schedule();
  };
  const retarget = (to: number) => {
    regFrom = reg;
    regTo = to;
    regT0 = performance.now();
    schedule();
  };
  const onOver = (e: Event) => {
    const target = e.target as HTMLElement;
    const relatedTarget = (e as PointerEvent).relatedTarget as Node | null;
    const p = target.closest?.(".cmyk .print");
    if (p && !(relatedTarget && p.contains(relatedTarget))) retarget(0);
  };
  const onOut = (e: Event) => {
    const target = e.target as HTMLElement;
    const relatedTarget = (e as PointerEvent).relatedTarget as Node | null;
    const p = target.closest?.(".cmyk .print");
    if (p && !(relatedTarget && p.contains(relatedTarget))) retarget(1);
  };

  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);

  return () => {
    removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    if (raf) cancelAnimationFrame(raf);
  };
}

let mounted = false;
export function mountPressPlates(): () => void {
  if (mounted) return () => {};
  mounted = true;
  const svg = injectDefs();
  return startPressDriver(svg);
}
