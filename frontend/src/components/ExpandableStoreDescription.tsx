"use client";

import { useEffect, useRef, useState } from "react";

export function ExpandableStoreDescription({ children }: { children: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const checkOverflow = () => {
      if (window.matchMedia("(max-width: 620px)").matches) {
        setCanExpand(text.scrollHeight > text.clientHeight + 1);
      } else {
        setCanExpand(false);
        setExpanded(false);
      }
    };
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <div className="store-description">
      <p
        ref={textRef}
        className="store-intro-description"
        data-expanded={expanded}
      >
        {children}
      </p>
      {(canExpand || expanded) && (
        <button
          type="button"
          className="store-description-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "收起" : "展開"}
        </button>
      )}
    </div>
  );
}
