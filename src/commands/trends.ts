import { convexCall } from "../client.js";
import { outputJson, outputTable } from "../output.js";

interface TrendPattern {
  name: string;
  description: string;
  exampleHook: string;
  whyTrending: string;
  platforms: string[];
  remixSuggestion: string;
}

interface TrendBrief {
  date: string;
  niche: string;
  patterns: TrendPattern[];
  source: "live" | "ai";
  rawItemCount: number;
  generatedAt: number;
}

export async function trendsCommand(options: {
  niche?: string;
  refresh?: boolean;
  pretty?: boolean;
}): Promise<void> {
  const niche = options.niche || "general";

  let brief: TrendBrief;

  if (options.refresh) {
    console.error("Refreshing trends from live data...");
    brief = await convexCall<TrendBrief>("action", "trendingBriefsAction:refreshLatest", {
      niche,
    });
  } else {
    brief = await convexCall<TrendBrief>("query", "trendingBriefs:getLatest", {
      niche,
    });
  }

  if (!brief || !brief.patterns?.length) {
    console.error("No trending patterns found. Try --refresh to fetch live data.");
    process.exit(1);
  }

  if (options.pretty) {
    console.error(`\nTrending Patterns — ${brief.date} [${brief.niche}] (${brief.source})\n`);
    outputTable(
      brief.patterns.map((p, i) => ({
        "#": i + 1,
        name: p.name,
        platforms: p.platforms.join(", "),
        hook: p.exampleHook.slice(0, 60) + (p.exampleHook.length > 60 ? "..." : ""),
      })),
      ["#", "name", "platforms", "hook"]
    );
    console.error(`\n${brief.patterns.length} patterns from ${brief.rawItemCount} raw items`);
  } else {
    outputJson(brief);
  }
}
