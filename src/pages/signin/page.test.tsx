import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignIn from "./page.tsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUpsertSupabaseUser = vi.fn();
const mockResolveEmailByIdentifier = vi.fn();
const mockListUserRolesForUser = vi.fn();
vi.mock("@/lib/backend.ts", () => ({
  upsertSupabaseUser: (...args: unknown[]) => mockUpsertSupabaseUser(...args),
  resolveEmailByIdentifier: (...args: unknown[]) => mockResolveEmailByIdentifier(...args),
  listUserRolesForUser: (...args: unknown[]) => mockListUserRolesForUser(...args),
}));

const mockSetProfile = vi.fn();
vi.mock("@/contexts/profile-context.tsx", async () => {
  const actual = await vi.importActual<typeof import("@/contexts/profile-context.tsx")>("@/contexts/profile-context.tsx");
  return { ...actual, useProfile: () => ({ profile: null, setProfile: mockSetProfile, clearProfile: vi.fn() }) };
});

// vi.mock factories are hoisted above top-level const declarations, so a
// mock referenced by name (to assert on it later) must come from vi.hoisted
// rather than a plain const, or it throws "Cannot access before initialization".
const {
  mockSignInWithPassword, mockSignInWithOAuth, mockSignInWithOtp, mockVerifyOtp, mockSignInWithSSO,
} = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockSignInWithOtp: vi.fn(),
  mockVerifyOtp: vi.fn(),
  mockSignInWithSSO: vi.fn(),
}));
vi.mock("@/lib/supabase-client.ts", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      signInWithSSO: mockSignInWithSSO,
    },
  },
}));

const { mockToastError, mockToastInfo } = vi.hoisted(() => ({ mockToastError: vi.fn(), mockToastInfo: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mockToastError, info: mockToastInfo } }));

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={["/en/signin"]}>
      <Routes>
        <Route path=":lng/signin" element={<SignIn />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SignIn", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the username/password login form plus the PayRus SSO section and a register link", () => {
    renderSignIn();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot username or password/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/en/register");
    for (const provider of ["Google", "Facebook", "GitHub", "Apple", "Microsoft"]) {
      expect(screen.getByText(provider)).toBeInTheDocument();
    }
  });

  it("requires both fields before attempting a login", async () => {
    renderSignIn();
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockSignInWithPassword).not.toHaveBeenCalled());
  });

  it("logs in with username + password and activates a single existing role", async () => {
    mockResolveEmailByIdentifier.mockResolvedValueOnce("aicha.fofana@test.payrus.app");
    mockListUserRolesForUser.mockResolvedValueOnce([{ role: "personal", complete: true }]);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "sb-uid-1", email: "aicha.fofana@test.payrus.app", user_metadata: {} } },
      error: null,
    });
    mockUpsertSupabaseUser.mockResolvedValue({ userId: "user_1", name: "Aïcha Fofana" });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "aicha.fofana" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Test1234" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({ type: "personal" })));
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: "aicha.fofana@test.payrus.app", password: "Test1234" });
    expect(mockNavigate).toHaveBeenCalledWith("/en", { replace: true });
    expect(localStorage.getItem("payrus_local_user_id")).toBe("user_1");
  });

  it("routes a roleless login to onboarding", async () => {
    mockResolveEmailByIdentifier.mockResolvedValueOnce("new.user@test.payrus.app");
    mockListUserRolesForUser.mockResolvedValueOnce([]);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "sb-uid-2", email: "new.user@test.payrus.app", user_metadata: {} } },
      error: null,
    });
    mockUpsertSupabaseUser.mockResolvedValue({ userId: "user_2", name: "New User" });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "new.user" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "Test1234" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/en/profile", { state: { existingUserId: "user_2", existingRoles: [] } }),
    );
  });

  it("surfaces an error when the identifier doesn't match any account", async () => {
    mockResolveEmailByIdentifier.mockResolvedValueOnce(null);
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "ghost" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "whatever" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("No account matches that username, email or phone."));
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("surfaces the specific error for a wrong password instead of a generic failure", async () => {
    mockResolveEmailByIdentifier.mockResolvedValueOnce("aicha.fofana@test.payrus.app");
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "aicha.fofana" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Incorrect password."));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("kicks off a Supabase OAuth redirect when a provider button is clicked", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    renderSignIn();
    fireEvent.click(screen.getByText("Google"));

    await waitFor(() => expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: expect.stringContaining("/en/auth/callback") },
    }));
    // Redirect-based — nothing to route on synchronously.
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows an error if the OAuth redirect itself fails locally", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: { message: "network error" } });
    renderSignIn();
    fireEvent.click(screen.getByText("Facebook"));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining("Facebook")));
  });

  it("sends a magic link to the resolved email", async () => {
    mockResolveEmailByIdentifier.mockResolvedValueOnce("aicha.fofana@test.payrus.app");
    mockSignInWithOtp.mockResolvedValue({ error: null });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "aicha.fofana" } });
    fireEvent.click(screen.getByText("Email me a sign-in link"));
    fireEvent.click(screen.getByText("Send link"));

    await waitFor(() => expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "aicha.fofana@test.payrus.app",
      options: { shouldCreateUser: false, emailRedirectTo: expect.stringContaining("/en/auth/callback") },
    }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });

  it("sends and verifies a phone OTP, then logs in", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ data: { user: { id: "sb-uid-3", email: null } }, error: null });
    mockUpsertSupabaseUser.mockResolvedValue({ userId: "user_3", name: "Phone User" });
    mockListUserRolesForUser.mockResolvedValueOnce([{ role: "personal", complete: true }]);
    renderSignIn();

    fireEvent.click(screen.getByText("Sign in with phone"));
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "+221770000000" } });
    fireEvent.click(screen.getByText("Send code"));

    await waitFor(() => expect(mockSignInWithOtp).toHaveBeenCalledWith({
      phone: "+221770000000",
      options: { shouldCreateUser: false },
    }));

    fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Verify"));

    await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: "+221770000000", token: "123456", type: "sms",
    }));
    await waitFor(() => expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({ type: "personal" })));
  });

  it("resolves a work email's domain via Enterprise SSO and redirects on success", async () => {
    mockSignInWithSSO.mockResolvedValue({ data: { url: "https://idp.example.com/sso" }, error: null });
    renderSignIn();

    fireEvent.click(screen.getByText("Sign in with company SSO"));
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "alex@acme.com" } });
    fireEvent.click(screen.getByText("Continue with SSO"));

    await waitFor(() => expect(mockSignInWithSSO).toHaveBeenCalledWith({
      domain: "acme.com",
      options: { redirectTo: expect.stringContaining("/en/auth/callback") },
    }));
  });

  it("shows a clear error when no SSO connection exists for the domain", async () => {
    mockSignInWithSSO.mockResolvedValue({ data: null, error: { message: "no connection" } });
    renderSignIn();

    fireEvent.click(screen.getByText("Sign in with company SSO"));
    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "alex@acme.com" } });
    fireEvent.click(screen.getByText("Continue with SSO"));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("No company SSO connection found for that domain."));
  });
});
