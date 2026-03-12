import { convexCall } from "../client.js";
import { outputJson, outputTable } from "../output.js";

interface VideoJob {
  _id: string;
  remixId: string;
  status: string;
  finalVideoUrl?: string;
  startedAt?: number;
  completedAt?: number;
  remix?: {
    hookText?: string;
    overallScore?: number;
    platformTarget?: string;
    tone?: string;
  };
}

export async function videosCommand(options: {
  limit?: string;
  pretty?: boolean;
}): Promise<void> {
  const limit = parseInt(options.limit || "10", 10);

  // Uses cli:getMyVideos which resolves userId from auth token server-side
  const videos = await convexCall<VideoJob[]>("query", "cli:getMyVideos", {
    limit,
  });

  if (!videos || videos.length === 0) {
    if (options.pretty) {
      console.error("No completed videos found.");
    } else {
      outputJson([]);
    }
    return;
  }

  if (options.pretty) {
    console.error(`\n${videos.length} completed video(s):\n`);
    outputTable(
      videos.map((v) => ({
        id: v._id.slice(-12),
        status: v.status,
        score: v.remix?.overallScore ?? "-",
        platform: v.remix?.platformTarget ?? "-",
        hook: (v.remix?.hookText || "").slice(0, 50) + ((v.remix?.hookText?.length ?? 0) > 50 ? "..." : ""),
        date: v.completedAt ? new Date(v.completedAt).toLocaleDateString() : "-",
      })),
      ["id", "status", "score", "platform", "hook", "date"]
    );
    console.error(`\nDownload: openfun download <id>`);
  } else {
    outputJson(videos);
  }
}
