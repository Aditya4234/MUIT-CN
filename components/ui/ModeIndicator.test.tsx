// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModeIndicator } from "@/components/ui/ModeIndicator";
import { useNavigationStore } from "@/store/navigationStore";

beforeEach(() => {
  useNavigationStore.getState().clearNavigation();
});

describe("ModeIndicator", () => {
  it("shows the 2D Map label in idle state", () => {
    render(<ModeIndicator />);
    expect(screen.getByText("2D Map")).toBeDefined();
  });

  it("reflects the active view mode", () => {
    useNavigationStore.getState().selectDestination("library");
    useNavigationStore.getState().setViewMode("ar-simulation");
    render(<ModeIndicator />);
    expect(screen.getByText("AR Simulation")).toBeDefined();
  });
});
