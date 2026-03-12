# openfun-cli

CLI for [OpenFun.ai](https://openfun.ai) — the AI video factory that reverse-engineers viral patterns and creates original short-form videos.

Optimized for AI agent consumption (OpenClaw, Codex, Claude). All output is JSON by default.

## Install

```bash
npm install -g openfun-cli
```

## Authenticate

```bash
# Browser-based login
openfun login

# Or use a token directly
openfun login --token <your-token>

# Or set env var
export OPENFUN_API_TOKEN=<your-token>
```

## Quick Start

```bash
# 1. Check what's trending
openfun trends --niche saas

# 2. Remix a viral video into an original script
openfun remix "https://tiktok.com/@creator/video/123" --niche saas --tone casual

# 3. Render the video
openfun render <remix-id> --voice echo

# 4. Check progress
openfun render status <job-id> --poll

# 5. Download
openfun download <job-id> -o my-video.mp4
```

## Commands

| Command | Description |
|---|---|
| `openfun login` | Authenticate with OpenFun |
| `openfun trends` | Get trending viral patterns |
| `openfun remix <url>` | Create a remix script from a URL, hook, or idea |
| `openfun render <remix-id>` | Generate video from a remix |
| `openfun render status <job-id>` | Check render progress |
| `openfun download <job-id>` | Download rendered video |
| `openfun videos` | List completed videos |
| `openfun account` | Check account and usage |

## Agent Usage

All commands output JSON to stdout by default. Pipe through `jq` for specific fields:

```bash
# Get the overall score from a remix
openfun remix "https://..." --niche saas | jq '.remix.overall_score'

# Get hook variants
openfun remix "https://..." | jq '.remix.hook_variants[] | {text, score, principle}'

# Get trending hook texts
openfun trends --niche fitness | jq '.patterns[].exampleHook'
```

Add `--pretty` for human-readable output:

```bash
openfun trends --niche saas --pretty
openfun remix "https://..." --pretty
```

## Configuration

Config stored at `~/.openfun/config.json`:

```bash
# Set Convex deployment URL
openfun login --deployment-url https://your-deployment.convex.cloud
```

Or use environment variables:

| Variable | Description |
|---|---|
| `OPENFUN_API_TOKEN` | API token (skips login) |
| `OPENFUN_DEPLOYMENT_URL` | Convex deployment URL |

## Pricing

| Tier | Remixes/mo | Videos/mo | Price |
|---|---|---|---|
| Free | 5 | 3 (watermarked) | $0 |
| Pro | Unlimited | 50 | $19/mo |
| Scale | Unlimited | 200 | $49/mo |

## License

MIT
