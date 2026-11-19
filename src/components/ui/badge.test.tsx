import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, StatusBadge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children with the requested tone", () => {
    render(<Badge tone="cyan">Live</Badge>);
    const badge = screen.getByText("Live");
    expect(badge).toHaveClass("bg-cyan-500/12", "text-cyan-200");
  });

  it("merges custom classes", () => {
    render(<Badge className="uppercase">New</Badge>);
    expect(screen.getByText("New")).toHaveClass("uppercase");
  });
});

describe("StatusBadge", () => {
  it("shows the human label and a status dot", () => {
    const { container } = render(<StatusBadge status="BOOKED" />);
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(container.querySelectorAll("span")).toHaveLength(2);
  });

  it("can hide the dot", () => {
    const { container } = render(<StatusBadge status="COMPLETED" showDot={false} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(container.querySelectorAll("span")).toHaveLength(1);
  });

  it("renders organization statuses", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("Pending review")).toBeInTheDocument();
  });
});
