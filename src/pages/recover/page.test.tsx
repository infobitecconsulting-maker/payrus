import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Recover from "./page.tsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockConvexQuery = vi.fn();
vi.mock("convex/react", async () => {
  const actual = await vi.importActual<typeof import("convex/react")>("convex/react");
  return { ...actual, useConvex: () => ({ query: mockConvexQuery }) };
});

const { mockResetPasswordForEmail } = vi.hoisted(() => ({ mockResetPasswordForEmail: vi.fn() }));
vi.mock("@/lib/supabase-client.ts", () => ({
  supabase: { auth: { resetPasswordForEmail: mockResetPasswordForEmail } },
}));

const { mockToastError } = vi.hoisted(() => ({ mockToastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mockToastError } }));

function renderRecover() {
  return render(
    <MemoryRouter initialEntries={["/en/recover"]}>
      <Routes>
        <Route path=":lng/recover" element={<Recover />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Recover", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("requests a username, email or phone before sending anything", async () => {
    renderRecover();
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(mockConvexQuery).not.toHaveBeenCalled());
  });

  it("resolves the identifier to an email and sends a real reset link via Supabase", async () => {
    mockConvexQuery.mockResolvedValueOnce("aicha.fofana@test.payrus.app");
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderRecover();

    fireEvent.change(screen.getByLabelText(/username, email or phone/i), { target: { value: "aicha.fofana" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "aicha.fofana@test.payrus.app",
      { redirectTo: expect.stringContaining("/en/reset-password") },
    );
  });

  it("shows an error when the identifier doesn't match any account", async () => {
    mockConvexQuery.mockResolvedValueOnce(null);
    renderRecover();

    fireEvent.change(screen.getByLabelText(/username, email or phone/i), { target: { value: "ghost" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("No account matches that username, email or phone."));
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });
});
