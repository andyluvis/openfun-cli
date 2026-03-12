import { convexCall } from "../client.js";
import { outputJson, outputTable } from "../output.js";

type VoiceId = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface VideoJob {
  _id: string;
  remixId: string;
  userId: string;
  status: string;
  currentAgent?: string;
  voiceId?: string;
  finalVideoUrl?: string;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
  remix?: {
    hookText?: string;
    bodyText?: string;
    ctaText?: string;
    overallScore?: number;
    platformTarget?: string;
  };
}

export async function renderCommand(
  remixId: string,
  options: {
    voice?: VoiceId;
    pretty?: boolean;
  }
): Promise<void> {
  if (!remixId) {
    console.error("Error: remix-id is required");
    console.error("Usage: openfun render <remix-id> [--voice echo]");
    process.exit(1);
  }

  console.error(`Starting video render for remix ${remixId}...`);

  // We need the userId. For now, we pass it through and let the server resolve.
  // The Convex mutation requires userId — the auth token should identify the user.
  const result = await convexCall<{ jobId: string }>("mutation", "videoJobs:create", {
    remixId,
    voiceId: options.voice || "echo",
  });

  if (options.pretty) {
    console.error(`\n✓ Render job started`);
    console.error(`  Job ID: ${result.jobId || result}`);
    console.error(`  Voice: ${options.voice || "echo"}`);
    console.error(`\nCheck progress: openfun render status ${result.jobId || result}`);
  } else {
    outputJson(result);
  }
}

export async function renderStatusCommand(
  jobId: string,
  options: { pretty?: boolean; poll?: boolean }
): Promise<void> {
  if (!jobId) {
    console.error("Error: job-id is required");
    console.error("Usage: openfun render status <job-id>");
    process.exit(1);
  }

  const job = await convexCall<VideoJob>("query", "videoJobs:getById", { jobId });

  if (!job) {
    console.error(`Error: Job ${jobId} not found`);
    process.exit(1);
  }

  if (options.poll && !["ready", "published", "failed"].includes(job.status)) {
    // Poll mode: keep checking until done
    console.error(`Polling job ${jobId}...`);
    let current = job;
    let lastStatus = "";

    while (!["ready", "published", "failed"].includes(current.status)) {
      if (current.status !== lastStatus) {
        console.error(`  [${current.status}] ${current.currentAgent || ""}`);
        lastStatus = current.status;
      }
      await new Promise((r) => setTimeout(r, 3000));
      current = await convexCall<VideoJob>("query", "videoJobs:getById", { jobId });
    }

    if (current.status === "failed") {
      console.error(`\n✗ Render failed: ${current.errorMessage || "Unknown error"}`);
      process.exit(2);
    }

    console.error(`\n✓ Render complete!`);
    if (current.finalVideoUrl) {
      console.error(`  Video URL: ${current.finalVideoUrl}`);
      console.error(`  Download: openfun download ${jobId}`);
    }
    outputJson(current);
    return;
  }

  if (options.pretty) {
    const elapsed = job.startedAt
      ? Math.round(((job.completedAt || Date.now()) - job.startedAt) / 1000)
      : 0;

    console.error(`\nJob: ${jobId}`);
    console.error(`Status: ${job.status}`);
    if (job.currentAgent) console.error(`Agent: ${job.currentAgent}`);
    console.error(`Elapsed: ${elapsed}s`);

    if (job.status === "failed") {
      console.error(`Error: ${job.errorMessage || "Unknown"}`);
    }
    if (job.finalVideoUrl) {
      console.error(`Video: ${job.finalVideoUrl}`);
      console.error(`\nDownload: openfun download ${jobId}`);
    }

    // Progress bar
    const stages = ["queued", "script", "voice", "caption", "music", "rendering", "ready"];
    const currentIdx = stages.indexOf(job.status);
    const bar = stages
      .map((s, i) => (i <= currentIdx ? `[${s}]` : ` ${s} `))
      .join(" → ");
    console.error(`\n${bar}`);
  } else {
    outputJson(job);
  }
}
