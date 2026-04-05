import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  console.log("main.tsx: Mounting root...");
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("main.tsx: Render called.");
} catch (error: any) {
  document.body.innerHTML = `<div style="padding: 2rem; color: #ff4444; font-family: monospace; font-size: 1.2rem; background: #111; height: 100vh;">
    <h1>CRITICAL MOUNT ERROR</h1>
    <pre>${error.stack || error.message || String(error)}</pre>
  </div>`;
  console.error(error);
}
