import { spawn } from "node:child_process";
import { createServer } from "vite";

const host = "127.0.0.1";
const server = await createServer({
  configFile: false,
  logLevel: "silent",
  server: { host, port: 0, hmr: false },
});

try {
  await server.listen();

  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Vite did not expose a local TCP address");
  }

  const browser = process.env.CHROMIUM_PATH ?? "chromium";
  const url = `http://${host}:${address.port}/`;
  const result = await run(browser, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--enable-logging=stderr",
    "--log-level=0",
    "--virtual-time-budget=2000",
    "--dump-dom",
    url,
  ]);

  if (result.code !== 0) {
    throw new Error(`Chromium exited with code ${result.code}\n${result.stderr}`);
  }

  if (!result.stdout.includes('<canvas id="canvas" width=')) {
    throw new Error(`application canvas was not initialized\n${result.stdout}`);
  }

  if (!result.stdout.includes('aria-label="Effect inspector"')) {
    throw new Error(`effect inspector was not initialized\n${result.stdout}`);
  }

  if (!result.stdout.includes('aria-label="Effect parameters"')) {
    throw new Error(`effect description flyout was not initialized\n${result.stdout}`);
  }

  if (!result.stdout.includes("photographic negative look")) {
    throw new Error(`effect description was not rendered\n${result.stdout}`);
  }

  if (!result.stdout.includes('aria-label="Debug mode"')) {
    throw new Error(`debug indicator was not initialized\n${result.stdout}`);
  }

  if (!result.stdout.includes('aria-label="Playback controls"')) {
    throw new Error(`playback controls were not initialized\n${result.stdout}`);
  }

  if (!result.stdout.includes('aria-label="Pause playback"')) {
    throw new Error(`playback state was not rendered\n${result.stdout}`);
  }

  const consoleErrors = result.stderr
    .split("\n")
    .filter((line) => line.includes("INFO:CONSOLE"))
    .filter((line) => /(?:Uncaught|\bError\b)/.test(line));

  if (consoleErrors.length > 0) {
    throw new Error(`browser console errors:\n${consoleErrors.join("\n")}`);
  }

  console.log("browser smoke test passed");
} finally {
  await server.close();
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}
