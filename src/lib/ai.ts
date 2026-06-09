import Groq from "groq-sdk";

// ─── Timeout helper ───────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label = ""): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Timeout after ${ms}ms${label ? ` (${label})` : ""}`)),
      ms
    )
  );
  return Promise.race([promise, timeout]);
}

// ─── Vision: Groq multimodal (Llama 4 Scout + fallbacks) ─────────────────────
// Uses the same GROQ_API_KEY already in use for captions.
// Tries models in order; any 4xx/timeout/network error moves to the next.
// If all models fail → throws { quotaExhausted: true } so the client shows
// the amber "type manually" warning without blocking caption generation.
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_VISION_MODELS = [
  // Llama 4 Scout — Groq's recommended replacement for decommissioned vision-preview models
  "meta-llama/llama-4-scout-17b-16e-instruct",
  // Alternate ID format Groq sometimes uses
  "llama-4-scout-17b-16e-instruct",
  // Llama 4 Maverick — larger fallback
  "meta-llama/llama-4-maverick-17b-128e-instruct",
] as const;

const VISION_PROMPT =
  "Describe this image in 1-2 sentences for social media caption purposes. " +
  "Be specific about subject, mood, atmosphere, and setting. " +
  "Focus on what makes this image interesting or shareable.";

export async function describeImage(imageData: {
  base64: string;
  mimeType: string;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const groq = new Groq({ apiKey });
  const dataUrl = `data:${imageData.mimeType};base64,${imageData.base64}`;

  for (const model of GROQ_VISION_MODELS) {
    try {
      const response = await withTimeout(
        groq.chat.completions.create({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUrl } },
                { type: "text", text: VISION_PROMPT },
              ],
            },
          ],
          max_tokens: 150,
          temperature: 0.4,
        }) as Promise<any>,
        12_000,
        model
      );

      const text = response.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error(`${model} returned empty response`);

      console.log(`[describe-image] ${model}: "${text.slice(0, 80)}..."`);
      return text;
    } catch (err: unknown) {
      // Check HTTP status directly (catches 400 model_decommissioned, 404, 429, etc.)
      // String match covers SDK-wrapped messages and timeout errors.
      const status = (err as { status?: number }).status;
      const msg    = String(err);
      const isSkippable =
        (status !== undefined && status >= 400) ||
        msg.includes("Timeout") ||
        msg.includes("rate_limit") ||
        msg.includes("decommissioned") ||
        msg.includes("not found") ||
        msg.includes("model_not_found");

      if (isSkippable) {
        console.warn(
          `[describe-image] ${model} unavailable (${status ?? "timeout/net"}): ${msg.slice(0, 100)}`
        );
        continue; // try next model
      }

      throw err; // unexpected error (auth, network failure, etc.) — surface it
    }
  }

  // All models exhausted
  console.warn("[describe-image] All Groq vision models unavailable");
  throw Object.assign(new Error("Image description unavailable"), { quotaExhausted: true });
}

// ─── Groq — caption generation (text only) ───────────────────────────────────
// Three-model fallback list for maximum free-tier reliability.
// response_format: json_object forces reliable JSON — no markdown-wrapping.
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
] as const;

export async function generateCaptionsWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const groq = new Groq({ apiKey });  // created once, reused across all model attempts
  let lastError: unknown;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a JSON API. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error("Empty response from Groq");
      return text.trim();
    } catch (err: unknown) {
      const msg = String(err);
      if (
        msg.includes("429") ||
        msg.includes("rate_limit") ||
        msg.includes("Rate limit") ||
        msg.includes("404") ||
        msg.includes("not found") ||
        msg.includes("does not exist") ||
        msg.includes("response_format")
      ) {
        console.warn(`[groq] ${model} unavailable, trying next`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw Object.assign(new Error("All Groq models rate-limited or unavailable"), {
    rateLimited: true,
    cause: lastError,
  });
}

// ─── Shared caption response parser ──────────────────────────────────────────
// Handles both the new { captions: [...] } object format (json_object mode)
// and the legacy bare array format as a fallback.
// ─────────────────────────────────────────────────────────────────────────────

export function parseCaptionResponse(raw: string): string[] {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    // New format: { captions: ["...", "...", ...] }
    if (parsed?.captions && Array.isArray(parsed.captions) && parsed.captions.length > 0) {
      return parsed.captions;
    }
    // Legacy format: ["...", "...", ...]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}

  // Extract array from anywhere in the string
  const match = cleaned.match(/\[[\s\S]*?\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // Last resort: split by newlines
  return cleaned
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter((l) => l.length > 15)
    .slice(0, 5);
}

// ─── Dev startup warnings ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  if (!process.env.GROQ_API_KEY) {
    console.warn("[ai] GROQ_API_KEY not set — both vision description and caption generation will fail");
  }
}
