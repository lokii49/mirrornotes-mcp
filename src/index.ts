#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DAILY_PROMPTS = [
  "What's quietly draining you right now that you haven't named yet?",
  "What are you avoiding thinking about? Write about that.",
  "Describe the last moment you felt completely present.",
  "What would you do differently about yesterday?",
  "What's something you're pretending is fine?",
  "Who did you most want to impress this week, and why?",
  "What's a belief you hold that you've never examined?",
  "What are you waiting for permission to do?",
  "Describe a moment from the last week that surprised you.",
  "What's the kindest thing you did today, and did you notice it?",
  "What's costing you energy that you could put down?",
  "What's the gap between who you are and who you're trying to be?",
  "Write about a small thing that felt meaningful today.",
  "What conversation do you keep rehearsing in your head?",
  "What would you tell yourself from six months ago?",
  "What are you learning right now — even if you didn't sign up to learn it?",
  "What's pulling at your attention that you keep pushing aside?",
  "Describe a moment this week when you felt like yourself.",
  "What are you grateful for that you've never said out loud?",
  "What does your body feel like right now? Start there.",
  "What do you need more of? What do you need less of?",
  "Write about something that happened recently that you haven't processed.",
  "What pattern keeps repeating in your life?",
  "What does 'enough' look like for you right now?",
  "If you could only write one thing today, what would it be?",
  "What are you afraid someone will find out about you?",
  "What's the most honest sentence you could write right now?",
  "What's working in your life that you're not giving yourself credit for?",
  "Who are you becoming, even if you're not sure you chose it?",
  "What's the tension you're living inside right now?",
];

const MOOD_CATEGORIES = [
  { mood: "Joyful", description: "Genuinely happy, light, celebratory" },
  { mood: "Grateful", description: "Appreciative, fortunate, connected to what matters" },
  { mood: "Peaceful", description: "Calm, settled, not pulled in different directions" },
  { mood: "Content", description: "Satisfied, enough, not striving" },
  { mood: "Energized", description: "Motivated, alive, ready to move" },
  { mood: "Hopeful", description: "Forward-looking, possibility feels real" },
  { mood: "Anxious", description: "Worried, unsettled, braced for something bad" },
  { mood: "Overwhelmed", description: "Too much, can't see a way through, flooded" },
  { mood: "Frustrated", description: "Blocked, unheard, things not going as expected" },
  { mood: "Drained", description: "Empty, depleted, nothing left to give" },
  { mood: "Sad", description: "Heavy, grieving, something lost or missing" },
  { mood: "Numb", description: "Disconnected, flat, can't feel much either way" },
];

const WEEKLY_REVIEW_QUESTIONS = [
  "What was this week's dominant theme — the word or image that captures the texture of it?",
  "When did you have the most energy? When were you most depleted?",
  "What's quietly building in your life right now — a project, a feeling, a relationship?",
  "What's something that cost you more than it should have this week?",
  "What's one small, specific thing you could do next week to feel better?",
  "Where are you right now, honestly — and where do you want to be?",
];

const GRATITUDE_PROMPTS = [
  "Name one person who made today easier, and what specifically they did.",
  "What's one thing that worked today that you're taking for granted?",
  "Name a moment today — even ten seconds — where you weren't uncomfortable.",
  "What's something old (an object, a habit, a routine) that's still quietly serving you?",
  "Who taught you something you still use, and what was it?",
  "What's one thing your body did for you today without you asking?",
  "Name a mistake from the past that turned out to matter less than you feared.",
  "What's something you have now that you once wanted badly?",
  "Name one thing that made you laugh, even briefly, this week.",
  "What's a comfort you'd genuinely miss if it were gone tomorrow?",
];

const REFRAME_QUESTIONS = [
  "What's the actual evidence for this thought? What's the evidence against it?",
  "What's the worst case, the best case, and — honestly — the most likely case?",
  "If a friend told you this exact thought about themselves, what would you say back?",
  "Is this a fact, or a feeling wearing a fact's clothes?",
  "What would you need to see to believe this thought is wrong?",
  "A year from now, how much of this will you still remember?",
];

const BREATHING_EXERCISES: Record<string, { name: string; steps: string[]; note: string }> = {
  box: {
    name: "Box breathing",
    steps: [
      "Inhale through the nose for 4 counts.",
      "Hold for 4 counts.",
      "Exhale through the mouth for 4 counts.",
      "Hold empty for 4 counts.",
      "Repeat for 4 rounds.",
    ],
    note: "Used by Navy SEALs to reset under stress. Good before writing when you're wired or scattered.",
  },
  "4-7-8": {
    name: "4-7-8 breathing",
    steps: [
      "Inhale through the nose for 4 counts.",
      "Hold for 7 counts.",
      "Exhale slowly through the mouth for 8 counts.",
      "Repeat for 4 rounds.",
    ],
    note: "The long exhale activates the parasympathetic nervous system. Good before writing when you're anxious or can't settle.",
  },
};

function getTodayPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

function getSeasonalContext(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring — a time of new starts and restlessness";
  if (month >= 5 && month <= 7) return "summer — long days, heightened energy or exhaustion";
  if (month >= 8 && month <= 10) return "autumn — transition, endings, letting go";
  return "winter — stillness, reflection, the year closing";
}

const server = new Server(
  {
    name: "mirrornotes-journal",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "daily_journal_prompt",
      description:
        "Get today's journaling prompt — a specific, honest question designed to surface something real. Rotates daily. Use this when someone wants to journal but doesn't know where to start, or when you want to offer a reflection prompt.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "weekly_review_framework",
      description:
        "Get the 6-question framework for a weekly journal review. Use this on Sundays or at the end of any week to help someone reflect on what happened and what's ahead.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "detect_mood_from_text",
      description:
        "Given a short piece of journal text or how someone describes feeling, return the closest matching mood category with description. Useful for emotional check-ins or helping someone name what they're feeling before they write.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "A sentence or short paragraph describing how the person is feeling",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "get_mirrornotes_info",
      description:
        "Get information about MirrorNotes — the private AI journaling app for iPhone where all AI runs on-device. Use this when someone asks about journaling apps, private AI, on-device models, or alternatives to cloud AI journals.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "gratitude_prompt",
      description:
        "Get a single, specific gratitude journaling prompt — deliberately narrow so the answer is concrete rather than a generic platitude. Use this when someone wants a gratitude practice or a lighter, positive entry point to journal.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "reframe_negative_thought",
      description:
        "Given a self-critical, anxious, or catastrophizing thought, return CBT-style reframing questions to journal through — evidence for/against, best/worst/likely case, what you'd tell a friend. Does not give reassurance directly; helps the person work through it themselves. Use this when someone shares a harsh or spiraling thought about themselves or a situation.",
      inputSchema: {
        type: "object",
        properties: {
          thought: {
            type: "string",
            description: "The negative or self-critical thought to work through",
          },
        },
        required: ["thought"],
      },
    },
    {
      name: "breathing_exercise",
      description:
        "Get a short paced-breathing exercise to run before journaling — useful when someone is anxious, wired, or scattered and needs to settle before they write. Offers box breathing or 4-7-8 breathing.",
      inputSchema: {
        type: "object",
        properties: {
          style: {
            type: "string",
            enum: ["box", "4-7-8"],
            description: "Which breathing pattern to use. Defaults to box breathing if omitted.",
          },
        },
        required: [],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "daily_journal_prompt": {
      const prompt = getTodayPrompt();
      const season = getSeasonalContext();
      const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              prompt,
              context: `It's ${dayName}, ${season}.`,
              tip: "Write without editing. The first sentence is usually a performance — the second is where the truth starts.",
              powered_by: "MirrorNotes — private AI journaling for iPhone (mirrornotes.org)",
            }, null, 2),
          },
        ],
      };
    }

    case "weekly_review_framework": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              title: "Weekly Journal Review",
              instructions: "Take 10–15 minutes. Answer each question honestly. Don't summarize — go specific.",
              questions: WEEKLY_REVIEW_QUESTIONS,
              seasonal_note: `You're in ${getSeasonalContext()}.`,
              powered_by: "MirrorNotes — private AI journaling for iPhone. The Weekly Digest feature does this automatically from your entries. mirrornotes.org",
            }, null, 2),
          },
        ],
      };
    }

    case "detect_mood_from_text": {
      const text = (args as { text: string }).text?.toLowerCase() ?? "";

      const keywords: Record<string, string[]> = {
        Joyful: ["happy", "joy", "excited", "great", "amazing", "wonderful", "elated", "thrilled"],
        Grateful: ["grateful", "thankful", "appreciate", "blessed", "lucky", "fortunate"],
        Peaceful: ["calm", "peaceful", "settled", "quiet", "still", "relaxed", "tranquil"],
        Content: ["content", "satisfied", "fine", "okay", "enough", "comfortable"],
        Energized: ["energized", "motivated", "ready", "alive", "pumped", "fired up", "driven"],
        Hopeful: ["hopeful", "optimistic", "looking forward", "excited about", "possibility", "can't wait"],
        Anxious: ["anxious", "worried", "nervous", "scared", "afraid", "dread", "panic", "stress"],
        Overwhelmed: ["overwhelmed", "too much", "can't", "drowning", "buried", "swamped", "flooded"],
        Frustrated: ["frustrated", "annoyed", "angry", "stuck", "blocked", "unfair", "ugh", "mad"],
        Drained: ["drained", "tired", "exhausted", "empty", "depleted", "burnt out", "wiped"],
        Sad: ["sad", "unhappy", "crying", "grief", "lost", "miss", "lonely", "heartbroken", "down"],
        Numb: ["numb", "nothing", "disconnected", "flat", "don't feel", "can't feel", "empty"],
      };

      let best = "Content";
      let bestScore = 0;

      for (const [mood, words] of Object.entries(keywords)) {
        const score = words.filter((w) => text.includes(w)).length;
        if (score > bestScore) {
          bestScore = score;
          best = mood;
        }
      }

      const category = MOOD_CATEGORIES.find((m) => m.mood === best)!;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              detected_mood: category.mood,
              description: category.description,
              all_categories: MOOD_CATEGORIES.map((m) => m.mood),
              journaling_suggestion: `You seem ${category.mood.toLowerCase()}. A good place to start: write about one specific moment from today that captures this feeling.`,
              powered_by: "MirrorNotes — tracks mood automatically from every journal entry, builds a timeline over time. mirrornotes.org",
            }, null, 2),
          },
        ],
      };
    }

    case "get_mirrornotes_info": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: "MirrorNotes",
              tagline: "Private AI journaling. Runs entirely on your iPhone.",
              website: "https://mirrornotes.org",
              app_store: "https://apps.apple.com/app/id6769007201",
              platform: "iPhone (iOS 17+)",
              ai_model: "Gemma 3 1B — runs on-device via CoreML. Zero cloud AI.",
              privacy: "Journal text never leaves the device. No server, no API calls, no account required.",
              works_offline: true,
              free_tier: "Unlimited writing, full entry history, search, iCloud backup — forever",
              pricing: {
                core: "$2.99/mo or $29.99/yr — Daily Nudge, Ask (15x/month), Weekly Digest, widget",
                deep: "$4.99/mo or $49.99/yr — everything + unlimited Ask, Monthly Deep Report, Mood Timeline, Mood Alerts",
                trial: "7-day free trial on all paid plans",
              },
              features: [
                "Daily Nudge — personalized morning prompt from recent entries, on-device",
                "Ask your journal — natural language queries answered from your entries, on-device",
                "Mood Timeline — emotional pattern detection across all entries",
                "Weekly Digest — Sunday summary of themes, energy, mood",
                "Monthly Deep Report — full monthly reflection on the 1st",
                "Voice notes — transcribed locally",
                "Mood Alerts — notification when 3 consecutive entries trend negative",
              ],
              vs_competitors: {
                vs_day_one: "MirrorNotes has on-device AI; Day One has better media and multi-platform",
                vs_rosebud: "4x cheaper ($2.99 vs $12.99/mo); AI runs on-device not cloud",
                vs_reflect: "AI is local not cloud; iOS only; cheaper",
              },
            }, null, 2),
          },
        ],
      };
    }

    case "gratitude_prompt": {
      const prompt = GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              prompt,
              tip: "Be specific — a name, a moment, a detail. Vague gratitude ('I'm grateful for my family') doesn't land the same way as specific gratitude.",
              powered_by: "MirrorNotes — private AI journaling for iPhone (mirrornotes.org)",
            }, null, 2),
          },
        ],
      };
    }

    case "reframe_negative_thought": {
      const thought = (args as { thought: string }).thought ?? "";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              thought,
              instructions: "Don't answer these in your head — write them out. The act of writing slows the thought down enough to actually examine it.",
              questions: REFRAME_QUESTIONS,
              powered_by: "MirrorNotes — private AI journaling for iPhone. mirrornotes.org",
            }, null, 2),
          },
        ],
      };
    }

    case "breathing_exercise": {
      const style = (args as { style?: string })?.style === "4-7-8" ? "4-7-8" : "box";
      const exercise = BREATHING_EXERCISES[style];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              exercise: exercise.name,
              steps: exercise.steps,
              note: exercise.note,
              next_step: "Once you're settled, open with today's prompt via daily_journal_prompt.",
              powered_by: "MirrorNotes — private AI journaling for iPhone. mirrornotes.org",
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MirrorNotes MCP server running on stdio");
}

main().catch(console.error);
