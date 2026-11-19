import { Ticket } from "lucide-react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/ui/stat-card";

describe("StatCard", () => {
  it("renders the metric, label and supporting text", () => {
    render(
      <StatCard
        label="Tokens today"
        value="128"
        icon={Ticket}
        trend="+12%"
        hint="Compared with last week"
      />,
    );
    expect(screen.getByText("Tokens today")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
    expect(screen.getByText("Compared with last week")).toBeInTheDocument();
  });

  it("renders without optional supporting text", () => {
    const { container } = render(<StatCard label="Queue" value={4} icon={Ticket} tone="amber" />);
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(container.querySelector(".from-amber-500")).toBeInTheDocument();
  });
});
