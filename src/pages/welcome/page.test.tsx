import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Welcome from "./page.tsx";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={["/en/welcome"]}>
      <Routes>
        <Route path=":lng/welcome" element={<Welcome />} />
        <Route path=":lng/signin" element={<LocationProbe />} />
        <Route path=":lng/register" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Welcome", () => {
  afterEach(() => {
    cleanup();
  });

  it("routes 'Get started' to registration, not the login screen", () => {
    renderWelcome();
    fireEvent.click(screen.getByText(/get started/i));

    expect(screen.getByTestId("location")).toHaveTextContent("/en/register");
  });

  it("routes 'I already have an account' to the username/password login screen", () => {
    renderWelcome();
    fireEvent.click(screen.getByText(/already have an account/i));

    expect(screen.getByTestId("location")).toHaveTextContent("/en/signin");
  });
});
