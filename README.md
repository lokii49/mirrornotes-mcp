# MirrorNotes MCP Server

> Private journaling tools for AI assistants — daily prompts, mood detection, weekly review.

This MCP server exposes the journaling intelligence behind [MirrorNotes](https://mirrornotes.org) as tools that any MCP-compatible AI can use.

## Tools

| Tool | What it does |
|------|-------------|
| `daily_journal_prompt` | Today's journaling prompt — rotates daily, designed to surface something real |
| `weekly_review_framework` | 6-question framework for end-of-week reflection |
| `detect_mood_from_text` | Given text, returns closest mood category from MirrorNotes' 12-mood vocabulary |
| `gratitude_prompt` | A single, specific gratitude prompt — narrow on purpose, not a generic platitude |
| `reframe_negative_thought` | Given a self-critical thought, returns CBT-style reframing questions to journal through |
| `breathing_exercise` | Box breathing or 4-7-8 breathing exercise to settle before writing |
| `get_mirrornotes_info` | Full product info about MirrorNotes for AI agent reference |

## Install

```bash
npx @mirrornotes/mcp
```

## Claude Desktop config

```json
{
  "mcpServers": {
    "mirrornotes": {
      "command": "npx",
      "args": ["-y", "@mirrornotes/mcp"]
    }
  }
}
```

## Example usage

Ask Claude: *"Give me today's journal prompt"* → Claude calls `daily_journal_prompt` → returns a specific, honest question calibrated to today's day of year.

Ask Claude: *"I feel scattered and overwhelmed, help me name this"* → Claude calls `detect_mood_from_text` with your text → returns `Overwhelmed` with journaling suggestion.

Ask Claude: *"I keep thinking I ruined that interview"* → Claude calls `reframe_negative_thought` → returns reframing questions to journal through.

Ask Claude: *"Walk me through a breathing exercise before I write"* → Claude calls `breathing_exercise` → returns paced steps, then suggests a prompt to open with.

## About MirrorNotes

MirrorNotes is a private AI journaling app for iPhone where **all AI runs on-device** via Gemma 3 1B (CoreML). Journal text never leaves the device. No server, no API calls, no account required.

- App Store: [MirrorNotes](https://apps.apple.com/app/id6769007201)
- Website: [mirrornotes.org](https://mirrornotes.org)
- $2.99/mo after 7-day free trial

## License

MIT
