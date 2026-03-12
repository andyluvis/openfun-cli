import { writeFileSync } from "node:fs";
import { convexCall } from "../client.js";
import { outputJson } from "../output.js";

interface VideoJob {
  _id: string;
  status: string;
  finalVideoUrl?: string;
  remixId: string;
}

export async function downloadCommand(
  jobId: string,
  options: { output?: string; pretty?: boolean }
): Promise<void> {
  if (!jobId) {
    console.error("Error: job-id is required");
    console.error("Usage: openfun download <job-id> [--output ./video.mp4]");
    process.exit(1);
  }

  // Get job details
  const job = await convexCall<VideoJob>("query", "videoJobs:getById", { jobId });

  if (!job) {
    console.error(`Error: Job ${jobId} not found`);
    process.exit(1);
  }

  if (job.status !== "ready" && job.status !== "published") {
    console.error(`Error: Video not ready. Current status: ${job.status}`);
    console.error(`Check progress: openfun render status ${jobId}`);
    process.exit(1);
  }

  if (!job.finalVideoUrl) {
    console.error("Error: No video URL available for this job.");
    process.exit(1);
  }

  const outputPath = options.output || `openfun-${jobId.slice(-8)}.mp4`;

  console.error(`Downloading video...`);

  const response = await fetch(job.finalVideoUrl);
  if (!response.ok) {
    console.error(`Error: Failed to download video (${response.status})`);
    process.exit(2);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outputPath, buffer);

  const sizeMb = (buffer.length / 1024 / 1024).toFixed(1);

  if (options.pretty) {
    console.error(`\n✓ Downloaded: ${outputPath} (${sizeMb} MB)`);
  } else {
    outputJson({
      path: outputPath,
      size: buffer.length,
      sizeMb: parseFloat(sizeMb),
      jobId,
    });
  }
}
