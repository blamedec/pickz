import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS !== "false";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {analyticsEnabled ? <Analytics /> : null}
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA registration is progressive enhancement; the app remains usable if blocked.
    });
  });
}
