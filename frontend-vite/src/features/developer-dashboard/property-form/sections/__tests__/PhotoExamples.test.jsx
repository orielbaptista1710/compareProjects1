import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhotoExamples from "../PhotoExamples";

describe("PhotoExamples", () => {
  it("starts closed and shows one good and four bad examples when opened", () => {
    const { container } = render(<PhotoExamples />);
    const panel = container.querySelector("details");
    expect(panel).not.toHaveAttribute("open");
    expect(screen.getByText("See good and bad photo examples")).toBeInTheDocument();

    expect(container.querySelectorAll(".lms-eg.is-good")).toHaveLength(1);
    expect(container.querySelectorAll(".lms-eg.is-bad")).toHaveLength(4);
  });

  it("describes every example in words, not only by the picture", () => {
    render(<PhotoExamples />);
    for (const label of ["Bright, straight and in focus", "Too dark", "Blurry", "Tilted", "Phone number or watermark"]) {
      expect(screen.getByRole("img", { name: label })).toBeInTheDocument();
    }
  });
});
