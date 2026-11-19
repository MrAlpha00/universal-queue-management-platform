import { CalendarClock } from "lucide-react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(
      <EmptyState
        icon={CalendarClock}
        title="No appointments yet"
        description="Your upcoming bookings will appear here."
      />,
    );
    expect(screen.getByRole("heading", { name: "No appointments yet" })).toBeInTheDocument();
    expect(screen.getByText("Your upcoming bookings will appear here.")).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(
      <EmptyState
        icon={CalendarClock}
        title="Nothing booked"
        description="Find a service to get started."
        action={<a href="/organizations">Explore organizations</a>}
      />,
    );
    expect(screen.getByRole("link", { name: "Explore organizations" })).toHaveAttribute(
      "href",
      "/organizations",
    );
  });
});
