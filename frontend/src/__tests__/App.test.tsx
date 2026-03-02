import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "../App.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders the button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /double 1/i })).toBeInTheDocument();
  });

  it("fetches and shows result on click", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ result: 2 }),
    } as Response);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /double 1/i }));

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("Result: 2");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/double", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: 1 }),
    });
  });

  it("shows error on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /double 1/i }));

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Error: Network error");
    });
  });
});
