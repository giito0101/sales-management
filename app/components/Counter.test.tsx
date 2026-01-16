import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("初期値は 0 と表示される", () => {
    render(<Counter />);

    expect(screen.getByTestId("count")).toHaveTextContent("Count: 0");
  });

  it("ボタンを押すとカウントが増える", () => {
    render(<Counter />);

    const button = screen.getByRole("button", { name: "+" });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByTestId("count")).toHaveTextContent("Count: 2");
  });
});
