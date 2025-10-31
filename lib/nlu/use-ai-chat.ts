// lib/nlu/intent-schema.ts
// Central type definition for the Intent API result.
// Import this type anywhere you consume /api/intent.

export type Intent =
  | "give_project_name"
  | "greeting"
  | "question"
  | "smalltalk"
  | "other";

/**
 * Result structure returned by the /api/intent route.
 */
export type IntentResult = {
  /**
   * Classified user intent.
   *  - "give_project_name"  → a plausible project name detected
   *  - "greeting"           → simple hello/intro message
   *  - "question"           → user is asking something, not naming
   *  - "smalltalk"          → casual chatter (e.g., “how are you”)
   *  - "other"              → anything else
   */
  intent: Intent;

  /** Extracted project name, or null if none confidently detected. */
  project_name: string | null;

  /** Detected language tag (e.g., "en", "fr", "hi"). */
  language: string;

  /** Confidence score between 0 and 1 (lower = uncertain). */
  confidence: number;

  /**
   * Message ready to display to the user.
   * If intent ≠ "give_project_name", this is a friendly localized
   * re-prompt such as:
   *   “Hi! Please share just the project name (e.g., ‘Scrap Sorting VSM’).”
   */
  assistant_message: string;
};
