import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";

import App from "./App.tsx";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

vi.mock("convex/react", async () => {
  const actual = await vi.importActual<typeof import("convex/react")>("convex/react");

  return {
    ...actual,
    useMutation: () => vi.fn(),
    useQuery: () => undefined,
  };
});

vi.mock("@/hooks/use-service-worker.ts", () => ({
  useServiceWorker: () => undefined,
}));

describe("PayRus demo smoke test", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("payrus_local_user_id", "demo-user");
    localStorage.setItem(
      "payrus_profile:demo-user",
      JSON.stringify({
        type: "personal",
        name: "Jean Dupont",
        accountNumber: "4821",
        tier: "Premium ✦",
        currency: "XAF",
        balance: 7303000,
        balanceUSD: 12149,
      }),
    );
  });

  it("renders the dashboard demo app", async () => {
    render(<App />);

    expect(screen.getAllByText(/Jean Dupont/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: /PayRus — Payment Solutions & Services/i }).length).toBeGreaterThan(0);
  });
});
