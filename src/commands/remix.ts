import { convexCall } from "../client.js";
import { outputJson, outputTable } from "../output.js";

type Platform = "tiktok" | "youtube";
type FunnelStage = "tofu" | "mofu" | "bofu";
type Tone = "casual" | "professional" | "edgy" | "wholesome" | "energetic" | "storytelling";

interface RemixSection {
  text: string;
  timestamp: string;
  score: number;
}

interface HookVariant {
  text: string;
  score: number;
  principle: string;
}

interface RemixResponse {
  original_language: string;
  original_language_name: string;
  english_summary: string;
  analysis: {
    pattern_applied: string;
    adaptations_made: string[];
    structure_archetype: string;
  };
  visual_style: Record<string, unknown>;
  remix: {
    hook: RemixSection;
    hook_variants: HookVariant[];
    hook_dimensions: {
      curiosity: number;
      pattern_interrupt: number;
      specificity: number;
      identity_targeting: number;
    };
    context: RemixSection;
    body: RemixSection;
    payoff: RemixSection;
    cta: RemixSection;
    audio_suggestion: string;
    overall_score: number;
    is_five_act: boolean;
  };
  storyboard: Array<{
    section: string;
    shot_number: number;
    shot_type: string;
    description: string;
  }>;
  boost_suggestions: string[];
  ai_tip: string;
  source_transcript?: string;
}

interface AutoDetectResult {
  platform: Platform;
  funnelStage: FunnelStage;
  niche: string;
  tone: Tone;
  suggestedVoice: string;
  language: string;
  languageName: string;
}

export async function remixCommand(
  urlArg: string | undefined,
  options: {
    niche?: string;
    tone?: Tone;
    platform?: Platform;
    funnel?: FunnelStage;
    auto?: boolean;
    hook?: string;
    idea?: string;
    pretty?: boolean;
  }
): Promise<void> {
  // Determine remix mode
  if (!urlArg && !options.hook && !options.idea) {
    console.error("Error: Provide a URL, --hook, or --idea");
    console.error('Usage: openfun remix <url> | openfun remix --hook "..." | openfun remix --idea "..."');
    process.exit(1);
  }

  let platform: Platform = options.platform || "tiktok";
  let tone: Tone | undefined = options.tone;
  let niche = options.niche;
  let funnelStage: FunnelStage | undefined = options.funnel;

  // Auto-detect settings from URL
  if (options.auto && urlArg) {
    console.error("Auto-detecting settings from URL...");
    const detected = await convexCall<AutoDetectResult>(
      "action",
      "videoAgents:autoDetectSettings",
      { url: urlArg }
    );
    platform = detected.platform;
    tone = tone || detected.tone;
    niche = niche || detected.niche;
    funnelStage = funnelStage || detected.funnelStage;
    console.error(
      `Detected: platform=${platform}, tone=${tone}, niche=${niche}, funnel=${funnelStage}, voice=${detected.suggestedVoice}`
    );
  }

  // Build args for remixFromUrl
  const args: Record<string, unknown> = {
    platform,
    ...(tone && { tone }),
    ...(niche && { niche }),
    ...(funnelStage && { funnelStage }),
  };

  if (urlArg) {
    args.url = urlArg;
  } else if (options.hook) {
    // Use a synthetic URL approach — pass hook as transcript
    args.url = "https://openfun.ai/cli-hook";
    args.transcript = options.hook;
  } else if (options.idea) {
    args.url = "https://openfun.ai/cli-idea";
    args.transcript = options.idea;
  }

  console.error("Generating remix...");
  const result = await convexCall<RemixResponse>("action", "ai:remixFromUrl", args);

  // Auto-save remix to get an ID for rendering
  console.error("Saving remix...");
  const saved = await convexCall<{ remixId: string }>("mutation", "cli:saveRemix", {
    sourceUrl: urlArg || undefined,
    platformTarget: platform,
    tone: tone || undefined,
    niche: niche || undefined,
    funnelStage: funnelStage || undefined,
    hookText: result.remix?.hook?.text,
    hookScore: result.remix?.hook?.score,
    bodyText: result.remix?.body?.text,
    bodyScore: result.remix?.body?.score,
    ctaText: result.remix?.cta?.text,
    ctaScore: result.remix?.cta?.score,
    overallScore: result.remix?.overall_score,
    aiAnalysis: result.analysis,
    aiSuggestions: result.boost_suggestions,
    hookVariants: result.remix?.hook_variants,
    hookDimensions: result.remix?.hook_dimensions ? {
      curiosity: result.remix.hook_dimensions.curiosity,
      patternInterrupt: result.remix.hook_dimensions.pattern_interrupt,
      specificity: result.remix.hook_dimensions.specificity,
      identityTargeting: result.remix.hook_dimensions.identity_targeting,
    } : undefined,
  });

  // Attach remixId to output
  const output = { ...result, remixId: saved.remixId };

  if (options.pretty) {
    console.error(`\n━━━ Remix Result ━━━`);
    console.error(`Remix ID: ${saved.remixId}`);
    console.error(`Language: ${result.original_language_name} (${result.original_language})`);
    console.error(`Pattern: ${result.analysis.pattern_applied}`);
    console.error(`Archetype: ${result.analysis.structure_archetype}`);
    console.error(`Overall Score: ${result.remix.overall_score}/100\n`);

    const sections = [
      { section: "Hook", ...result.remix.hook },
      { section: "Context", ...result.remix.context },
      { section: "Body", ...result.remix.body },
      { section: "Payoff", ...result.remix.payoff },
      { section: "CTA", ...result.remix.cta },
    ];

    outputTable(
      sections.map((s) => ({
        section: s.section,
        score: s.score,
        text: s.text.slice(0, 70) + (s.text.length > 70 ? "..." : ""),
      })),
      ["section", "score", "text"]
    );

    if (result.remix.hook_variants?.length) {
      console.error("\nHook Variants:");
      outputTable(
        result.remix.hook_variants.map((v, i) => ({
          "#": i + 1,
          score: v.score,
          principle: v.principle,
          text: v.text.slice(0, 60) + (v.text.length > 60 ? "..." : ""),
        })),
        ["#", "score", "principle", "text"]
      );
    }

    if (result.ai_tip) {
      console.error(`\n💡 AI Tip: ${result.ai_tip}`);
    }

    console.error(`\nRender: openfun render ${saved.remixId}`);
  } else {
    outputJson(output);
  }
}
