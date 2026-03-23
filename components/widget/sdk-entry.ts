/* global window */
import * as React from "react";
import { useWidgetStore } from "../../src/store/useWidgetStore";
import WidgetLoader from "./WidgetLoader";
import { createRoot } from "react-dom/client";

type InitArgs = { projectKey: string };
type IdentifyArgs = { id: string; email?: string };

declare global {
  interface Window {
    KkokNote?: {
      init: (args: InitArgs) => void;
      identify: (args: IdentifyArgs) => void;
    };
  }
}

function ensureWidgetMount(projectKey: string) {
  const selector = `kkoknote-root[data-project-key="${projectKey}"]`;
  const existing = document.querySelector(selector) as HTMLElement | null;
  if (existing) return;

  const host = document.createElement("div");
  host.className = "kkoknote-root";
  host.setAttribute("data-project-key", projectKey);
  document.body.appendChild(host);

  const mount = document.createElement("div");
  host.appendChild(mount);

  const root = createRoot(mount);
  root.render(React.createElement(WidgetLoader, { projectKey }));
}

export function bootstrapKkokNote() {
  window.KkokNote = window.KkokNote ?? {
    init: ({ projectKey }) => {
      ensureWidgetMount(projectKey);

      // If user identified previously, rehydrate state for the newly mounted widget.
      try {
        const raw = localStorage.getItem("kkoknote:identify");
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string; email?: string | null };
          if (parsed?.id) {
            useWidgetStore.getState().identify({
              id: parsed.id,
              email: parsed.email ?? null,
            });
          }
        }
      } catch {
        // ignore
      }
    },
    identify: ({ id, email }) => {
      // Persist for later submit/vote operations.
      try {
        localStorage.setItem(
          "kkoknote:identify",
          JSON.stringify({ id, email: email ?? null })
        );
      } catch {
        // ignore
      }

      useWidgetStore.getState().identify({ id, email: email ?? null });
    },
  };
}

// Auto-bootstrap when the SDK bundle is executed.
bootstrapKkokNote();

