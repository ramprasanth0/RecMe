/**
 * Comprehensive test for the recommendations pipeline
 * Tests: SSE parsing, JSON extraction, Zod validation, full prod API
 * Run: node test-recommendations.mjs
 */

import { z } from "zod";

const BASE_URL = "https://rec-me-mu.vercel.app";

// ─── Replicate client-side logic ───────────────────────────────────────────

function extractJSON(text) {
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        return null;
      }
    }
    return null;
  }
}

const MusicItemSchema = z.object({
  title: z.string(),
  artist: z.string(),
  spotifyUri: z.string().optional(),
  reason: z.string(),
  albumArt: z.string().url().optional(),
});

const MusicRecommendationSchema = z.object({
  type: z.literal("music"),
  items: z.array(MusicItemSchema),
});

const MovieItemSchema = z.object({
  title: z.string(),
  year: z.number(),
  tmdbId: z.number(),
  genres: z.array(z.string()),
  reason: z.string(),
  posterPath: z.string().optional(),
  rating: z.number().optional(),
});

const MovieRecommendationSchema = z.object({
  type: z.literal("movie"),
  items: z.array(MovieItemSchema),
});

async function parseSSEStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) {
          accumulated += parsed.text;
          chunks.push(parsed.text);
        }
      } catch {
        console.log("  [skip malformed line]:", line.slice(0, 80));
      }
    }
  }

  if (buffer.startsWith("data: ")) {
    const data = buffer.slice(6).trim();
    if (data && data !== "[DONE]") {
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) accumulated += parsed.text;
      } catch {}
    }
  }

  return { accumulated, chunks };
}

// ─── Test runner ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ─── 1. extractJSON unit tests ───────────────────────────────────────────────

console.log("\n── 1. extractJSON ──────────────────────────────────────────");

test("clean JSON", () => {
  const result = extractJSON('{"type":"music","items":[]}');
  assert(result !== null, "should not be null");
  assert(JSON.parse(result).type === "music", "type should be music");
});

test("JSON with leading/trailing whitespace", () => {
  const result = extractJSON('  \n {"type":"music","items":[]}\n  ');
  assert(result !== null, "should not be null");
});

test("JSON wrapped in markdown fences", () => {
  const result = extractJSON("```json\n{\"type\":\"music\",\"items\":[]}\n```");
  assert(result !== null, "should not be null");
  assert(JSON.parse(result).type === "music", "type should be music");
});

test("JSON wrapped in plain fences", () => {
  const result = extractJSON("```\n{\"type\":\"music\",\"items\":[]}\n```");
  assert(result !== null, "should not be null");
});

test("JSON with surrounding text", () => {
  const result = extractJSON('Here are your recommendations:\n{"type":"music","items":[]}\nEnjoy!');
  assert(result !== null, "should not be null");
});

test("empty string returns null", () => {
  const result = extractJSON("");
  assert(result === null, "should be null");
});

test("plain text no JSON returns null", () => {
  const result = extractJSON("Sorry, I cannot help with that.");
  assert(result === null, "should be null");
});

test("partial/broken JSON returns null", () => {
  const result = extractJSON('{"type":"music","items":[{"title":');
  assert(result === null, "should be null for broken JSON");
});

// ─── 2. Zod schema tests ─────────────────────────────────────────────────────

console.log("\n── 2. Zod schema validation ────────────────────────────────");

test("valid music response parses", () => {
  const data = {
    type: "music",
    items: [{ title: "Redbone", artist: "Childish Gambino", reason: "Smooth groove" }],
  };
  const result = MusicRecommendationSchema.parse(data);
  assert(result.items.length === 1, "should have 1 item");
});

test("valid movie response parses", () => {
  const data = {
    type: "movie",
    items: [{ title: "Inception", year: 2010, tmdbId: 27205, genres: ["Sci-Fi"], reason: "Mind-bending" }],
  };
  const result = MovieRecommendationSchema.parse(data);
  assert(result.items.length === 1, "should have 1 item");
});

test("music item without optional fields passes", () => {
  const data = {
    type: "music",
    items: [{ title: "Test", artist: "Artist", reason: "Good" }],
  };
  MusicRecommendationSchema.parse(data);
});

test("music item with invalid albumArt URL fails", () => {
  let threw = false;
  try {
    MusicRecommendationSchema.parse({
      type: "music",
      items: [{ title: "T", artist: "A", reason: "R", albumArt: "not-a-url" }],
    });
  } catch {
    threw = true;
  }
  assert(threw, "should throw on invalid URL");
});

test("movie missing required year fails", () => {
  let threw = false;
  try {
    MovieRecommendationSchema.parse({
      type: "movie",
      items: [{ title: "T", tmdbId: 1, genres: [], reason: "R" }],
    });
  } catch {
    threw = true;
  }
  assert(threw, "should throw on missing year");
});

// ─── 3. SSE parsing unit tests ───────────────────────────────────────────────

console.log("\n── 3. SSE chunk parsing ────────────────────────────────────");

function makeSSEStream(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function testSSE(name, rawChunks, expectedAccumulated) {
  try {
    const stream = makeSSEStream(rawChunks);
    const res = { body: stream };
    const { accumulated } = await parseSSEStream(res);
    assert(
      accumulated === expectedAccumulated,
      `expected "${expectedAccumulated}" got "${accumulated}"`
    );
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

const jsonPayload = '{"type":"music","items":[{"title":"T","artist":"A","reason":"R"}]}';

const sseMsg = `data: ${JSON.stringify({ text: jsonPayload })}\n\ndata: [DONE]\n\n`;

// All in one chunk
await testSSE("single chunk", [sseMsg], jsonPayload);

// Split in middle of the data line
const mid = Math.floor(sseMsg.length / 2);
await testSSE(
  "data line split across chunks",
  [sseMsg.slice(0, mid), sseMsg.slice(mid)],
  jsonPayload
);

// Split into many tiny chunks
await testSSE(
  "many tiny chunks",
  sseMsg.split("").map((c) => c),
  jsonPayload
);

// Multiple SSE text events that assemble into full JSON
const part1 = jsonPayload.slice(0, 30);
const part2 = jsonPayload.slice(30, 60);
const part3 = jsonPayload.slice(60);
await testSSE(
  "JSON split across multiple text events",
  [
    `data: {"text":${JSON.stringify(part1)}}\n\n`,
    `data: {"text":${JSON.stringify(part2)}}\n\n`,
    `data: {"text":${JSON.stringify(part3)}}\n\n`,
    `data: [DONE]\n\n`,
  ],
  jsonPayload
);

// ─── 4. Full pipeline integration test ───────────────────────────────────────

console.log("\n── 4. Full pipeline: prod API → parse → Zod ────────────────");

async function fullPipelineTest(type, mood) {
  console.log(`\n  Testing ${type} / "${mood}"...`);
  try {
    const res = await fetch(`${BASE_URL}/api/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, mood }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { accumulated, chunks } = await parseSSEStream(res);

    console.log(`  SSE chunks received: ${chunks.length}`);
    console.log(`  Accumulated length: ${accumulated.length} chars`);
    console.log(`  First 120 chars: ${accumulated.slice(0, 120).replace(/\n/g, "\\n")}`);

    const jsonStr = extractJSON(accumulated);
    if (!jsonStr) {
      console.log(`  ❌ extractJSON returned null`);
      console.log(`  Full accumulated:\n${accumulated}`);
      failed++;
      return;
    }

    const parsed = JSON.parse(jsonStr);
    console.log(`  Parsed type: ${parsed.type}, items: ${parsed.items?.length}`);

    if (type === "music") {
      const validated = MusicRecommendationSchema.parse(parsed);
      console.log(`  ✅ Zod valid — ${validated.items.length} music items`);
      validated.items.forEach((item, i) => {
        console.log(`     ${i + 1}. ${item.title} — ${item.artist}`);
      });
    } else {
      const validated = MovieRecommendationSchema.parse(parsed);
      console.log(`  ✅ Zod valid — ${validated.items.length} movie items`);
      validated.forEach?.((item, i) => {
        console.log(`     ${i + 1}. ${item.title} (${item.year})`);
      });
    }
    passed++;
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    if (e.errors) console.log("  Zod errors:", JSON.stringify(e.errors, null, 2));
    failed++;
  }
}

await fullPipelineTest("music", "late night chill");
await fullPipelineTest("movie", "something thrilling");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(55)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("All tests passed ✅");
} else {
  console.log("Some tests failed ❌ — see details above");
}
