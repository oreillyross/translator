import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import type { Grammar } from "@translator/shared";
import { PromptComposer } from "./PromptComposer.js";

const grammar: Grammar = {
  template: {
    id: "v1-template",
    trailingLiteral: ".",
    slots: [
      { id: "language", bucketId: "languages", prefix: "You are ", suffix: "", rendersArticle: true },
      { id: "role", bucketId: "roles", prefix: " ", suffix: "", rendersArticle: false },
      { id: "taskVerb", bucketId: "taskVerbs", prefix: ". ", suffix: "", rendersArticle: false },
      { id: "artifact", bucketId: "artifacts", prefix: " me to write ", suffix: "", rendersArticle: false },
      { id: "context", bucketId: "contexts", prefix: " ", suffix: "", rendersArticle: false },
    ],
  },
  buckets: [
    {
      id: "languages",
      terms: [
        { value: "dutch", display: "Dutch", article: "a" },
        { value: "french", display: "French", article: "a" },
      ],
    },
    { id: "roles", terms: [{ value: "teacher", display: "teacher" }] },
    { id: "taskVerbs", terms: [{ value: "help", display: "Help" }] },
    { id: "artifacts", terms: [{ value: "email", display: "an email" }] },
    { id: "contexts", terms: [{ value: "to_my_college_professor", display: "to my college professor" }] },
  ],
};

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
