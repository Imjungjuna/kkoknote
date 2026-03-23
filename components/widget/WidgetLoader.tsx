"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import WidgetUI from "./WidgetUI";

type WidgetLoaderProps = {
  projectKey: string;
};

const WIDGET_STYLE = `
/* Widget-only styles (Shadow DOM scoped). */
:host, * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
.kkoknote-widget { display: inline-block; }
.kkoknote-button {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  padding: 8px 10px;
  background: #000;
  color: #fff;
  font-size: 12px;
  border: none;
  cursor: pointer;
}
.kkoknote-button:active { transform: translateY(1px); }

.kkoknote-textarea, .kkoknote-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.2);
  padding: 8px;
  font-size: 12px;
  resize: vertical;
  outline: none;
  background: #fff;
  color: #111;
}

.kkoknote-toast {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0,0,0,0.85);
  color: #fff;
  font-size: 12px;
}

.kkoknote-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  background: rgba(0,0,0,0.06);
  color: #111;
}
`;

export default function WidgetLoader({ projectKey }: WidgetLoaderProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const hostEl = hostRef.current;
    const shadowRoot = hostEl.shadowRoot ?? hostEl.attachShadow({ mode: "open" });

    // Inject widget styles once.
    if (!shadowRoot.querySelector('style[data-kkoknote="1"]')) {
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-kkoknote", "1");
      styleEl.textContent = WIDGET_STYLE;
      shadowRoot.appendChild(styleEl);
    }

    if (!rootRef.current) {
      // Create a mount point inside shadow DOM.
      const mount = document.createElement("div");
      shadowRoot.appendChild(mount);
      rootRef.current = createRoot(mount);
    }

    rootRef.current.render(<WidgetUI projectKey={projectKey} />);
  }, [projectKey]);

  return <div ref={hostRef} />;
}

