import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".openfun");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const CREDENTIALS_FILE = join(CONFIG_DIR, "credentials.json");

export interface Config {
  deploymentUrl: string;
}

export interface Credentials {
  token: string;
  expiresAt?: number;
}

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig(): Config {
  const defaultUrl =
    process.env.OPENFUN_DEPLOYMENT_URL || "https://your-deployment.convex.cloud";

  if (existsSync(CONFIG_FILE)) {
    try {
      const raw = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
      return { deploymentUrl: raw.deploymentUrl || defaultUrl };
    } catch {
      // corrupted config, use defaults
    }
  }
  return { deploymentUrl: defaultUrl };
}

export function saveConfig(config: Partial<Config>): void {
  ensureDir();
  const existing = getConfig();
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + "\n");
}

export function getCredentials(): Credentials | null {
  // Env var override
  const envToken = process.env.OPENFUN_API_TOKEN;
  if (envToken) {
    return { token: envToken };
  }

  if (!existsSync(CREDENTIALS_FILE)) return null;

  try {
    const raw = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8"));
    if (!raw.token) return null;
    if (raw.expiresAt && Date.now() > raw.expiresAt) {
      return null; // expired
    }
    return raw as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  ensureDir();
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2) + "\n");
}

export function clearCredentials(): void {
  if (existsSync(CREDENTIALS_FILE)) {
    writeFileSync(CREDENTIALS_FILE, "{}");
  }
}
