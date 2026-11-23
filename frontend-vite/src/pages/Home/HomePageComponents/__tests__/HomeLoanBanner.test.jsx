import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomeLoanBanner from "../HomeLoanBanner";

describe("HomeLoanBanner", () => {
  it("shows the headline and links the CTA to the loan page", () => {
    render(
      <MemoryRouter>
        <HomeLoanBanner />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /get your home loan easily/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no sign-up/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /check eligibility/i })
    ).toHaveAttribute("href", "/apnaloan");
  });
});
