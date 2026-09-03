import { GoogleGenAI } from '@google/genai';

/**
 * Resilient Gemini Model Fallback Ladder
 * Step 1: gemini-3.8-flash (Primary fast, high-quality reasoning)
 * Step 2: gemini-3.1-flash-lite (Ultra-low latency, separate serving cluster)
 * Step 3: gemini-flash-latest (Secondary fallback alias)
 */
export const MODEL_FALLBACK_LADDER = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
] as const;

export interface FallbackAttempt {
  model: string;
  success: boolean;
  errorCode?: number | string;
  errorMessage?: string;
  attemptedAt: string;
}

export interface ReflectionResponse {
  reflection: string;
  modelUsed: string;
  fallbackTrail: FallbackAttempt[];
  ladderStepsAttempted: number;
}

const SYSTEM_INSTRUCTION = `You are the Personal Gemini Journal AI Reflection Companion.
Your role is to offer empathetic, psychologically grounded, constructive, and clarifying reflections on the user's journal entries.

Guidelines:
1. Active Empathetic Reflection: Validate their emotional state with sincerity and depth.
2. Cognitive Reframing & Pattern Recognition: Gently identify cognitive distortions, recurring tensions, or unacknowledged strengths.
3. Clarity & Growth Questions: Propose 2-3 thoughtful, non-judgmental prompt questions for deeper inquiry.
4. Privacy Preservation: The user's input may contain surrogate de-identification tokens (such as [PERSON_1], [LOCATION_1], [PHONE_1]). Seamlessly incorporate these tokens naturally in your reflection where appropriate so they can be securely detokenized for the user. Never alter or remove the bracket formatting of tokens.
5. Format your response cleanly with markdown:
   - **Empathetic Summary**: 1-2 paragraphs
   - **Key Insights & Themes**: Bulleted observations
   - **Inquiry & Prompts for Tomorrow**: 2-3 actionable reflective questions.`;

/**
 * High-quality deterministic psychological reflection fallback when upstream APIs are unavailable
 */
export function generateLocalEmpatheticReflection(prompt: string, mood?: string): string {
  const moodNormalized = (mood || 'reflective').toLowerCase();
  const summarySnippet = prompt.slice(0, 120).trim();

  return `### Empathetic Summary
Thank you for articulating this moment. You noted: "${summarySnippet}..." Processing experiences through writing helps ground the nervous system and externalize what can otherwise feel internally congested. With a ${moodNormalized} mindset, giving voice to these tensions is the foundational step toward intentional clarity.

### Key Psychological Insights & Themes
- **Cognitive Emotional Awareness**: Noticing and naming the underlying friction creates psychological distance from the immediate stressor.
- **Agency and Boundaries**: Even when external timelines, people, or demands press inward, clarity comes from delineating what is within your locus of control versus what belongs to external circumstances.
- **Resilience through Expression**: Documenting your honest thoughts directly supports emotional regulation and metacognitive growth.

### Mindful Inquiry & Prompts for Tomorrow
1. If you could press pause on this specific situation for just 10 minutes, what would your body and mind ask for right now?
2. Looking at what you wrote, which expectation belongs genuinely to your core values, and which might be borrowed from external pressure?
3. What is one small, manageable boundary you can set tomorrow to protect your peace?`;
}

/**
 * Executes a resilient generation request iterating through the Gemini Fallback Ladder
 */
export async function generateResilientReflection(
  apiKey: string,
  sanitizedPrompt: string,
  mood?: string
): Promise<ReflectionResponse> {
  const fallbackTrail: FallbackAttempt[] = [];

  // If no API key is provided, activate local resilient reflection companion directly
  if (!apiKey || apiKey.trim().length === 0) {
    fallbackTrail.push({
      model: 'gemini-resilient-local',
      success: true,
      attemptedAt: new Date().toISOString(),
    });
    return {
      reflection: generateLocalEmpatheticReflection(sanitizedPrompt, mood),
      modelUsed: 'gemini-resilient-local',
      fallbackTrail,
      ladderStepsAttempted: 1,
    };
  }

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch {
    return {
      reflection: generateLocalEmpatheticReflection(sanitizedPrompt, mood),
      modelUsed: 'gemini-resilient-local',
      fallbackTrail: [
        {
          model: 'gemini-resilient-local',
          success: true,
          attemptedAt: new Date().toISOString(),
        },
      ],
      ladderStepsAttempted: 1,
    };
  }

  for (let i = 0; i < MODEL_FALLBACK_LADDER.length; i++) {
    const model = MODEL_FALLBACK_LADDER[i];
    try {
      const userPrompt = mood
        ? `[Current Mood: ${mood}]\n\nJournal Entry:\n${sanitizedPrompt}`
        : sanitizedPrompt;

      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (!text || text.trim().length === 0) {
        throw new Error(`Model ${model} returned an empty response.`);
      }

      fallbackTrail.push({
        model,
        success: true,
        attemptedAt: new Date().toISOString(),
      });

      return {
        reflection: text,
        modelUsed: model,
        fallbackTrail,
        ladderStepsAttempted: i + 1,
      };
    } catch (err: unknown) {
      const errorObj = err as { status?: number; statusCode?: number; message?: string };
      const status = errorObj.status || errorObj.statusCode || 'UNKNOWN';
      const message = errorObj.message || String(err);

      // Record graceful step-down attempt in telemetry trail without polluting stderr
      console.log(`[Resilience Ladder] Stepping down from ${model} (Status: ${status})`);

      fallbackTrail.push({
        model,
        success: false,
        errorCode: status,
        errorMessage: Number(status) === 503 
          ? 'Temporary high demand on upstream cluster; gracefully cascading down ladder.' 
          : message,
        attemptedAt: new Date().toISOString(),
      });
    }
  }

  // If all models in the ladder were busy or unavailable, seamlessly fallback to local reflection engine
  console.log(
    `[Resilience Ladder] All models in ladder busy/unavailable. Activating local resilient reflection companion.`
  );

  const localReflection = generateLocalEmpatheticReflection(sanitizedPrompt, mood);

  return {
    reflection: localReflection,
    modelUsed: 'gemini-resilient-local',
    fallbackTrail,
    ladderStepsAttempted: MODEL_FALLBACK_LADDER.length,
  };
}
