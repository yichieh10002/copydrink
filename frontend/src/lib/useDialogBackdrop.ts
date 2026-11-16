"use client";

import { useRef, type PointerEvent } from "react";

function isOutside(event: PointerEvent<HTMLDialogElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

// Use pointer coordinates for mouse and touch rather than relying on a
// browser-specific click target for the native dialog's ::backdrop.
export function useDialogBackdrop(onDismiss?: () => void) {
  const outsidePointer = useRef<number | null>(null);

  return {
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      outsidePointer.current =
        event.button === 0 && isOutside(event) ? event.pointerId : null;
    },
    onPointerUp(event: PointerEvent<HTMLDialogElement>) {
      const shouldDismiss =
        outsidePointer.current === event.pointerId && isOutside(event);
      outsidePointer.current = null;
      if (!shouldDismiss) return;
      if (onDismiss) onDismiss();
      else event.currentTarget.close();
    },
    onPointerCancel() {
      outsidePointer.current = null;
    },
  };
}
