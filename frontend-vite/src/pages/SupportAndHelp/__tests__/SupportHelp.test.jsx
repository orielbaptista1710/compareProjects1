// Help centre (/supportHelp): topics swap the question list, the accordion
// opens one answer at a time, and search jumps straight to an answer.
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import SupportHelp from "../SupportHelp";

beforeAll(() => {
  // jsdom has no layout, so scrollIntoView doesn't exist.
  Element.prototype.scrollIntoView = () => {};
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <SupportHelp />
    </MemoryRouter>
  );

describe("SupportHelp", () => {
  it("shows the topics and the common questions, with the first one open", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: /how can we help/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buying and comparing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Common questions" })).toBeInTheDocument();

    const first = screen.getByRole("button", { name: "How do I compare projects?" });
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/up to four projects/i)).toBeVisible();
  });

  it("opens one answer at a time", async () => {
    const user = userEvent.setup();
    renderPage();

    const brokerage = screen.getByRole("button", { name: "Do I pay any brokerage?" });
    await user.click(brokerage);

    expect(brokerage).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "How do I compare projects?" }))
      .toHaveAttribute("aria-expanded", "false");
  });

  it("shows a topic's questions and goes back to common questions", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /for agents/i }));

    expect(screen.getByRole("heading", { level: 2, name: "For agents" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /how do i become an agent/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Do I pay any brokerage?" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^common questions$/i }));
    expect(screen.getByRole("heading", { name: "Common questions" })).toBeInTheDocument();
  });

  it("keeps developer and customer password help separate", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /account and login/i }));
    await user.click(screen.getByRole("button", { name: /i'm a developer and forgot my password/i }));

    expect(screen.getByText(/send us your username and phone number/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /go to developer login/i })).toHaveAttribute("href", "/login");
  });

  it("search finds an answer and opens it", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: /search help/i }), "fake listing");
    await user.click(screen.getByRole("button", { name: /report a wrong or fake listing/i }));

    expect(screen.getByRole("heading", { level: 2, name: "Privacy and safety" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /report a wrong or fake listing/i }))
      .toHaveAttribute("aria-expanded", "true");
  });

  it("tells the user when search finds nothing", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: /search help/i }), "zzzz");
    expect(screen.getByText(/no answers match/i)).toBeInTheDocument();
  });
});
