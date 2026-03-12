import { convexCall } from "../client.js";
import { outputJson } from "../output.js";
import { getCredentials } from "../config.js";

interface Profile {
  _id: string;
  email: string;
  displayName?: string;
  tier: "free" | "pro" | "scale";
  remixesUsedThisMonth: number;
  videosGeneratedThisMonth?: number;
  reputationScore: number;
}

interface RemixStats {
  bestScore: number;
  avgScore: number;
  count: number;
}

const TIER_LIMITS = {
  free: { remixes: 5, videos: 3 },
  pro: { remixes: Infinity, videos: 50 },
  scale: { remixes: Infinity, videos: 200 },
};

export async function accountCommand(options: {
  pretty?: boolean;
}): Promise<void> {
  const creds = getCredentials();
  if (!creds) {
    console.error('Error: Not authenticated. Run "openfun login" first.');
    process.exit(1);
  }

  // Fetch profile — the server resolves userId from the auth token
  // Since there's no direct "getMyProfile" query exposed, we'll call a general endpoint
  // For now, output what we can from the auth state
  try {
    const stats = await convexCall<RemixStats>("query", "remixes:getBestScore", {
      sinceDaysAgo: 30,
    });

    if (options.pretty) {
      console.error("\n━━━ OpenFun Account ━━━\n");
      console.error(`Remixes (30d): ${stats.count}`);
      console.error(`Best Score: ${stats.bestScore}/100`);
      console.error(`Avg Score: ${stats.avgScore}/100`);
      console.error("");
      console.error("Manage account: https://app.openfun.ai/app/settings");
    } else {
      outputJson({
        stats,
        manageUrl: "https://app.openfun.ai/app/settings",
      });
    }
  } catch {
    // If stats query fails, just show basic info
    if (options.pretty) {
      console.error("\n━━━ OpenFun Account ━━━");
      console.error("Authenticated ✓");
      console.error("\nManage account: https://app.openfun.ai/app/settings");
    } else {
      outputJson({
        authenticated: true,
        manageUrl: "https://app.openfun.ai/app/settings",
      });
    }
  }
}
