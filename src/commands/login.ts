import { createServer } from "node:http";
import { saveCredentials, saveConfig, getConfig } from "../config.js";
import { outputSuccess, outputError } from "../output.js";

const CALLBACK_PORT = 19876;

export async function loginCommand(options: {
  token?: string;
  deploymentUrl?: string;
}): Promise<void> {
  // If deployment URL provided, save it
  if (options.deploymentUrl) {
    saveConfig({ deploymentUrl: options.deploymentUrl });
    outputSuccess(`Deployment URL saved: ${options.deploymentUrl}`);
  }

  // Manual token mode
  if (options.token) {
    saveCredentials({ token: options.token });
    outputSuccess("Token saved. You're authenticated.");
    return;
  }

  // Browser-based auth flow
  const config = getConfig();
  const appUrl = config.deploymentUrl.includes("convex.cloud")
    ? "https://www.openfun.ai"
    : config.deploymentUrl;

  const loginUrl = `${appUrl}/cli-auth?callback=http://localhost:${CALLBACK_PORT}/callback`;

  console.error(`Opening browser to authenticate...`);
  console.error(`If the browser doesn't open, visit:\n${loginUrl}\n`);

  // Dynamic import for open (ESM)
  const open = await import("open");
  await open.default(loginUrl);

  // Start local server to receive the callback
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      outputError(
        "Login timed out after 120 seconds. Use --token <token> to authenticate manually."
      );
      server.close();
      process.exit(1);
    }, 120_000);

    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${CALLBACK_PORT}`);

      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token");

        if (token) {
          saveCredentials({ token });

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html><body style="font-family: system-ui; text-align: center; padding: 60px;">
              <h1>✓ Authenticated</h1>
              <p>You can close this tab and return to the terminal.</p>
            </body></html>
          `);

          clearTimeout(timeout);
          outputSuccess("Authenticated successfully.");
          server.close();
          resolve();
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing token parameter");
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(CALLBACK_PORT, () => {
      console.error(`Waiting for authentication callback on port ${CALLBACK_PORT}...`);
    });
  });
}
