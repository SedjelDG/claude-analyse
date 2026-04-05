// electron/wait-and-launch.cjs
// Waits for Vite to be ready, then launches Electron
const http = require("http");
const { execSync } = require("child_process");

const URL = "http://127.0.0.1:8080";
const MAX_RETRIES = 30;
let retries = 0;

function check() {
  http.get(URL, (res) => {
    if (res.statusCode === 200) {
      console.log("[electron-launcher] Vite is ready, launching Electron...");
      execSync("electron .", { stdio: "inherit", cwd: process.cwd() });
    } else {
      retry();
    }
  }).on("error", () => {
    retry();
  });
}

function retry() {
  retries++;
  if (retries >= MAX_RETRIES) {
    console.error("[electron-launcher] Vite did not start in time.");
    process.exit(1);
  }
  setTimeout(check, 1000);
}

check();
