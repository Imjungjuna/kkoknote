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

.kkoknote-host {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.kkoknote-toggle-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #111827;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.22);
  flex-shrink: 0;
  transition: transform 0.15s, background 0.15s;
}
.kkoknote-toggle-btn:hover { background: #374151; transform: scale(1.06); }
.kkoknote-toggle-btn:active { transform: scale(0.96); }
.kkoknote-toggle-btn svg { width: 22px; height: 22px; }

.kkoknote-panel {
  width: 340px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  overflow: hidden;
  animation: kkok-slidein 0.18s ease;
}
@keyframes kkok-slidein {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.kkoknote-panel-inner {
  overflow-y: auto;
  flex: 1;
  padding: 16px;
}

.kkoknote-tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  padding: 0 16px;
  gap: 4px;
  flex-shrink: 0;
}
.kkoknote-tab {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.12s;
}
.kkoknote-tab:hover { color: #111827; }
.kkoknote-tab.active { color: #111827; border-bottom-color: #111827; }

.kkoknote-panel-header {
  display: flex;
  align-items: center;
  padding: 14px 16px 0;
  gap: 8px;
  flex-shrink: 0;
}
.kkoknote-panel-title { font-weight: 700; font-size: 14px; color: #111827; }
.kkoknote-panel-user { margin-left: auto; font-size: 11px; color: #9ca3af; }

.kkoknote-button {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  padding: 7px 12px;
  background: #111827;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.12s;
}
.kkoknote-button:hover { background: #374151; }
.kkoknote-button:active { transform: translateY(1px); }
.kkoknote-button:disabled { opacity: 0.55; cursor: not-allowed; }

.kkoknote-textarea, .kkoknote-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.15);
  padding: 8px 10px;
  font-size: 13px;
  resize: vertical;
  outline: none;
  background: #fff;
  color: #111;
  transition: border-color 0.12s;
}
.kkoknote-textarea:focus, .kkoknote-input:focus {
  border-color: #111827;
}

.kkoknote-toast {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(0,0,0,0.82);
  color: #fff;
  font-size: 12px;
}

.kkoknote-feedback-card {
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.1);
  padding: 10px 12px;
  background: #fafafa;
}

.kkoknote-status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
}
.kkoknote-status-badge.pending  { background: #f3f4f6; color: #6b7280; }
.kkoknote-status-badge.progress { background: #eff6ff; color: #3b82f6; }
.kkoknote-status-badge.done     { background: #f0fdf4; color: #16a34a; }

.kkoknote-update-item {
  border-left: 2px solid #e5e7eb;
  padding-left: 12px;
  padding-bottom: 16px;
}
.kkoknote-update-item:last-child { padding-bottom: 0; }
.kkoknote-update-title { font-size: 13px; font-weight: 600; color: #111827; }
.kkoknote-update-date  { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.kkoknote-update-body  { font-size: 12px; color: #374151; margin-top: 6px; white-space: pre-wrap; line-height: 1.5; }

.kkoknote-empty { font-size: 12px; color: #9ca3af; text-align: center; padding: 24px 0; }
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
      const mount = document.createElement("div");
      shadowRoot.appendChild(mount);
      rootRef.current = createRoot(mount);
    }

    rootRef.current.render(<WidgetUI projectKey={projectKey} />);
  }, [projectKey]);

  return <div ref={hostRef} />;
}
