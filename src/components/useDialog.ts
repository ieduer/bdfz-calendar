import { useEffect, useRef } from "react";

/** Keep focus and scrolling inside either calendar detail dialog. */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const background = document.querySelector<HTMLElement>(".page-shell");
    const previousInert = background?.inert ?? false;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLButtonElement>(".sheet-close")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key !== "Tab") return;
      const targets = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'));
      const first = targets[0];
      const last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    dialog.addEventListener("keydown", onKey);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (background) background.inert = previousInert;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);
  return ref;
}
