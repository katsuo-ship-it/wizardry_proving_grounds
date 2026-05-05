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

  it("invokes onSelect on hotkey press (direct)", () => {
    const handleA = vi.fn();
    render(<Menu items={[{ hotkey: "A", label: "Alpha", onSelect: handleA }]} />);
    fireEvent.keyDown(window, { key: "a" });
    expect(handleA).toHaveBeenCalledTimes(1);
  });

  it("ArrowDown moves cursor and Enter selects current item", () => {
    const handleA = vi.fn();
    const handleB = vi.fn();
    render(
      <Menu
        items={[
          { hotkey: "A", label: "Alpha", onSelect: handleA },
          { hotkey: "B", label: "Beta", onSelect: handleB },
        ]}
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(handleA).not.toHaveBeenCalled();
    expect(handleB).toHaveBeenCalledTimes(1);
  });

  it("ArrowUp wraps from first item to last", () => {
    const handleC = vi.fn();
    render(
      <Menu
        items={[
          { hotkey: "A", label: "Alpha", onSelect: () => {} },
          { hotkey: "B", label: "Beta", onSelect: () => {} },
          { hotkey: "C", label: "Gamma", onSelect: handleC },
        ]}
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: " " });
    expect(handleC).toHaveBeenCalledTimes(1);
  });

  it("skips disabled items in cursor navigation", () => {
    const handleA = vi.fn();
    const handleC = vi.fn();
    render(
      <Menu
        items={[
          { hotkey: "A", label: "Alpha", onSelect: handleA },
          { hotkey: "B", label: "Beta", onSelect: () => {}, disabled: true },
          { hotkey: "C", label: "Gamma", onSelect: handleC },
        ]}
      />,
    );
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(handleA).not.toHaveBeenCalled();
    expect(handleC).toHaveBeenCalledTimes(1);
  });

  it("renders cursor marker on the active item", () => {
    render(
      <Menu
        items={[
          { hotkey: "A", label: "Alpha", onSelect: () => {} },
          { hotkey: "B", label: "Beta", onSelect: () => {} },
        ]}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]?.className).toContain("menu-item--cursor");
    expect(buttons[1]?.className).not.toContain("menu-item--cursor");
  });
});
