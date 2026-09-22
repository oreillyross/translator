import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { sampleGrammar as grammar } from "@translator/shared";
import { PromptComposer } from "./PromptComposer.js";

function Harness() {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <PromptComposer grammar={grammar} nextFieldRef={bodyRef} />
      <textarea ref={bodyRef} aria-label="body" />
    </>
  );
}

describe("PromptComposer", () => {
  it("shows a ghost completion for the current slot as the user types", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: /compose the language/i });
    await user.type(input, "du");
    expect(input).toHaveValue("du");
    expect(screen.getByText("tch")).toBeInTheDocument();
  });

  it("rejects a keystroke that cannot lead to any term (HC-1)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: /compose the language/i });
    await user.type(input, "xyz");
    expect(input).toHaveValue("");
  });

  it("Tab accepts the completion, renders its article, and advances to the next slot", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: /compose the language/i });
    await user.type(input, "du");
    await user.tab();
    expect(screen.getByText("a Dutch")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /compose the role/i })).toBeInTheDocument();
  });

  it("Backspace at slot start un-commits the previous term", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const languageInput = screen.getByRole("textbox", { name: /compose the language/i });
    await user.type(languageInput, "du");
    await user.tab();
    const roleInput = screen.getByRole("textbox", { name: /compose the role/i });
    expect(roleInput).toHaveValue("");
    await user.keyboard("{Backspace}");
    expect(screen.getByRole("textbox", { name: /compose the language/i })).toBeInTheDocument();
    expect(screen.queryByText("a Dutch")).not.toBeInTheDocument();
  });

  it("completing every slot shows the completion signal and Enter moves focus to the body box", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole("textbox", { name: /compose the language/i }), "du");
    await user.tab();
    await user.type(screen.getByRole("textbox", { name: /compose the role/i }), "teacher");
    await user.tab();
    await user.type(screen.getByRole("textbox", { name: /compose the task/i }), "help");
    await user.tab();
    await user.type(screen.getByRole("textbox", { name: /compose the artifact/i }), "email");
    await user.tab();
    await user.type(screen.getByRole("textbox", { name: /compose the context/i }), "to my college professor");
    await user.tab();

    expect(screen.getByText(/press enter to continue/i)).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("textbox", { name: "body" })).toHaveFocus();
  });
});
