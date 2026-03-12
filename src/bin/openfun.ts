#!/usr/bin/env node

import { Command } from "commander";
import { loginCommand } from "../commands/login.js";
import { trendsCommand } from "../commands/trends.js";
import { remixCommand } from "../commands/remix.js";
import { renderCommand, renderStatusCommand } from "../commands/render.js";
import { downloadCommand } from "../commands/download.js";
import { videosCommand } from "../commands/videos.js";
import { accountCommand } from "../commands/account.js";

const program = new Command();

program
  .name("openfun")
  .description("OpenFun CLI — AI video factory. Create viral short-form videos from trending patterns.")
  .version("0.1.0");

// ── Login ────────────────────────────────────────────────────

program
  .command("login")
  .description("Authenticate with OpenFun")
  .option("--token <token>", "Manually provide an API token")
  .option("--deployment-url <url>", "Set the Convex deployment URL")
  .action(loginCommand);

// ── Trends ───────────────────────────────────────────────────

program
  .command("trends")
  .description("Get trending viral patterns from TikTok & YouTube")
  .option("--niche <niche>", "Filter by niche (e.g., saas, fitness, marketing)")
  .option("--refresh", "Force-refresh from live platform data")
  .option("--pretty", "Human-readable table output")
  .action(trendsCommand);

// ── Remix ────────────────────────────────────────────────────

program
  .command("remix [url]")
  .description("Create a remix script from a viral video URL, hook, or idea")
  .option("--niche <niche>", "Target niche")
  .option("--tone <tone>", "Script tone (casual|professional|edgy|wholesome|energetic|storytelling)")
  .option("--platform <platform>", "Target platform (tiktok|youtube)", "tiktok")
  .option("--funnel <stage>", "Funnel stage (tofu|mofu|bofu)")
  .option("--auto", "Auto-detect settings from the URL")
  .option("--hook <text>", "Remix from a hook line instead of a URL")
  .option("--idea <text>", "Remix from a content idea")
  .option("--pretty", "Human-readable output")
  .action(remixCommand);

// ── Render ───────────────────────────────────────────────────

const renderCmd = program
  .command("render <remix-id>")
  .description("Generate a video from a remix")
  .option("--voice <voice>", "Voice (alloy|echo|fable|onyx|nova|shimmer)", "echo")
  .option("--pretty", "Human-readable output")
  .action(renderCommand);

renderCmd
  .command("status <job-id>")
  .description("Check video render progress")
  .option("--poll", "Wait until render completes")
  .option("--pretty", "Human-readable output")
  .action(renderStatusCommand);

// ── Download ─────────────────────────────────────────────────

program
  .command("download <job-id>")
  .description("Download a rendered video")
  .option("-o, --output <path>", "Output file path (default: openfun-<id>.mp4)")
  .option("--pretty", "Human-readable output")
  .action(downloadCommand);

// ── Videos ───────────────────────────────────────────────────

program
  .command("videos")
  .description("List your completed videos")
  .option("--limit <n>", "Number of videos to list", "10")
  .option("--pretty", "Human-readable table output")
  .action(videosCommand);

// ── Account ──────────────────────────────────────────────────

program
  .command("account")
  .description("Check your account tier and usage stats")
  .option("--pretty", "Human-readable output")
  .action(accountCommand);

// ── Parse ────────────────────────────────────────────────────

program.parse();
