import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const sessionId = (() => {
  const stored = sessionStorage.getItem("slv_session");
  if (stored) return stored;
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessionStorage.setItem("slv_session", id);
  return id;
})();

function sendHeartbeat() {
  const page = window.location.pathname;
  fetch("/api/track/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, page }),
  }).catch(() => {});
}

sendHeartbeat();
setInterval(sendHeartbeat, 30000);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
