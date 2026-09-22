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

/** Renders the composer and returns a ready userEvent session. */
function setupComposer() {
  const user = userEvent.setup();
  render(<Harness />);
  return user;
}

/** The live slot's `<input>`, found by its `aria-label` (e.g. "language", "role"). */
function slotInput(slotLabel: string) {
  return screen.getByRole("textbox", { name: new RegExp(`compose the ${slotLabel}`, "i") });
}

/** Types a full term into the given slot and accepts it with Tab. */
async function fillSlot(user: ReturnType<typeof userEvent.setup>, slotLabel: string, text: string) {
  await user.type(slotInput(slotLabel), text);
  await user.tab();
}

describe("PromptComposer", () => {
  it("shows a ghost completion for the current slot as the user types", async () => {
    const user = setupComposer();
    const input = slotInput("language");
    await user.type(input, "du");
    expect(input).toHaveValue("du");
    expect(screen.getByText("tch")).toBeInTheDocument();
  });

  it("rejects a keystroke that cannot lead to any term (HC-1)", async () => {
    const user = setupComposer();
    const input = slotInput("language");
    await user.type(input, "xyz");
    expect(input).toHaveValue("");
  });

  it("Tab accepts the completion, renders its article, and advances to the next slot", async () => {
    const user = setupComposer();
    await fillSlot(user, "language", "du");
    expect(screen.getByText("a Dutch")).toBeInTheDocument();
    expect(slotInput("role")).toBeInTheDocument();
  });

  it("Backspace at slot start un-commits the previous term", async () => {
    const user = setupComposer();
    await fillSlot(user, "language", "du");
    expect(slotInput("role")).toHaveValue("");
    await user.keyboard("{Backspace}");
    expect(slotInput("language")).toBeInTheDocument();
    expect(screen.queryByText("a Dutch")).not.toBeInTheDocument();
  });

  it("completing every slot shows the completion signal and Enter moves focus to the body box", async () => {
    const user = setupComposer();

    await fillSlot(user, "language", "du");
    await fillSlot(user, "role", "teacher");
    await fillSlot(user, "task", "help");
    await fillSlot(user, "artifact", "email");
    await fillSlot(user, "context", "to my college professor");

    expect(screen.getByText(/press enter to continue/i)).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("textbox", { name: "body" })).toHaveFocus();
  });
});
