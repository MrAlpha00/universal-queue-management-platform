import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders a native button with the default variant", () => {
    render(<Button>Continue</Button>);
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeEnabled();
    expect(button).toHaveClass("bg-gradient-to-r", "rounded-xl");
  });

  it("disables the button and shows a spinner while loading", () => {
    const { container } = render(<Button loading>Saving</Button>);
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("supports asChild composition for links", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/signup">Create account</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Create account" });
    expect(link).toHaveAttribute("href", "/signup");
    expect(link).toHaveClass("border-white/10");
  });

  it("applies size variants", () => {
    render(<Button size="xl">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-14");
  });
});
