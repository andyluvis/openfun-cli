import { getConfig, getCredentials } from "./config.js";

export type ConvexCallType = "query" | "mutation" | "action";

export interface ConvexResponse<T = unknown> {
  status: "success" | "error";
  value?: T;
  errorMessage?: string;
  errorData?: unknown;
}

function requireAuth(): string {
  const creds = getCredentials();
  if (!creds) {
    console.error(
      'Error: Not authenticated. Run "openfun login" first, or set OPENFUN_API_TOKEN env var.'
    );
    process.exit(1);
  }
  return creds.token;
}

export async function convexCall<T = unknown>(
  type: ConvexCallType,
  path: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const config = getConfig();
  const token = requireAuth();
  const url = `${config.deploymentUrl}/api/${type}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API error (${response.status}): ${text}`);
    process.exit(2);
  }

  const data = (await response.json()) as ConvexResponse<T>;

  if (data.status === "error") {
    console.error(`Convex error: ${data.errorMessage || "Unknown error"}`);
    if (data.errorData) {
      console.error("Details:", JSON.stringify(data.errorData, null, 2));
    }
    process.exit(2);
  }

  return data.value as T;
}

export async function convexCallPublic<T = unknown>(
  type: ConvexCallType,
  path: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const config = getConfig();
  const url = `${config.deploymentUrl}/api/${type}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add auth if available, but don't require it
  const creds = getCredentials();
  if (creds) {
    headers.Authorization = `Bearer ${creds.token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ path, args, format: "json" }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API error (${response.status}): ${text}`);
    process.exit(2);
  }

  const data = (await response.json()) as ConvexResponse<T>;

  if (data.status === "error") {
    console.error(`Convex error: ${data.errorMessage || "Unknown error"}`);
    process.exit(2);
  }

  return data.value as T;
}
