import { Frame } from "@/ui/components/Frame";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("<Frame>", () => {
  it("renders children inside a framed div", () => {
    render(
      <Frame title="MENU">
        <p>Hello</p>
      </Frame>,
    );
    expect(screen.getByText("MENU")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("has the apple2-frame class", () => {
    const { container } = render(
      <Frame>
        <span />
      </Frame>,
    );
    expect(container.querySelector(".apple2-frame")).not.toBeNull();
  });
});
