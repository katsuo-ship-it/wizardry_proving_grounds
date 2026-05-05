import { Menu } from "@/ui/components/Menu";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("<Menu>", () => {
  afterEach(() => cleanup());

  it("renders all items with hotkey labels", () => {
    render(
      <Menu
        items={[
          { hotkey: "T", label: "Training Grounds", onSelect: () => {} },
          { hotkey: "M", label: "Maze", onSelect: () => {} },
        ]}
      />,
    );
    expect(screen.getByText(/Training Grounds/)).toBeInTheDocument();
    expect(screen.getByText(/Maze/)).toBeInTheDocument();
    expect(screen.getByText("[T]")).toBeInTheDocument();
    expect(screen.getByText("[M]")).toBeInTheDocument();
  });

  it("invokes onSelect when item clicked", () => {
    const handleA = vi.fn();
    render(
      <Menu
        items={[
          { hotkey: "A", label: "Alpha", onSelect: handleA },
          { hotkey: "B", label: "Beta", onSelect: () => {} },
        ]}
      />,
    );
    fireEvent.click(screen.getByText(/Alpha/));
    expect(handleA).toHaveBeenCalledTimes(1);
  });

  it("invokes onSelect on hotkey press", () => {
    const handleA = vi.fn();
    render(<Menu items={[{ hotkey: "A", label: "Alpha", onSelect: handleA }]} />);
    fireEvent.keyDown(window, { key: "a" });
    expect(handleA).toHaveBeenCalledTimes(1);
  });
});
