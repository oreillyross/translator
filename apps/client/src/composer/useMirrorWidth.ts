import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * Measures the rendered pixel width of `text` via an invisible mirror span
 * sharing the input's font, so the draft `<input>` can auto-size to its
 * content instead of the composer needing to position anything by hand
 * (4.4) — it stays correct across font, resize and long-line cases because
 * it re-measures on every render rather than caching an offset.
 */
export function useMirrorWidth(text: string): { mirrorRef: RefObject<HTMLSpanElement>; width: number } {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(8);

  useLayoutEffect(() => {
    const measured = mirrorRef.current?.offsetWidth;
    setWidth(measured && measured > 0 ? measured + 2 : 8);
  }, [text]);

  return { mirrorRef, width };
}
