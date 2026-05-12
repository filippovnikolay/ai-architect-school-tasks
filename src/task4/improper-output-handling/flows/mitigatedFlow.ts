import type { AzureOpenAI } from "openai";
import { containsDangerousOutput, escapeHtml } from "../domain/sinkSafety";

const SYSTEM = [
    "You are MarketingSnippetBot for an internal admin dashboard.",
    "",
    "Return a JSON object with a single field `headline` (plain text only).",
    "Do not include HTML tags, event handler attributes, URLs to cloud metadata hosts, or script instructions.",
    "The server will HTML-escape your headline before it is ever placed in the DOM.",
].join("\n");

export interface MitigatedResult {
    raw: string;
    /** Value safe to treat as text (post-escape); what the app would insert after mitigation. */
    reply: string | null;
    blockedDueToLeak: boolean;
}

/**
 * Mitigations: structured output + mandatory HTML escaping before any sink,
 * plus a final check that the post-escape payload still matches no dangerous heuristics.
 */
export async function mitigatedChat(
    openai: AzureOpenAI,
    model: string,
    untrustedUserText: string
): Promise<MitigatedResult> {
    const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "snippet_headline",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        headline: {
                            type: "string",
                            description: "Short plain-text headline for the widget; no HTML.",
                        },
                    },
                    required: ["headline"],
                    additionalProperties: false,
                },
            },
        },
        messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: untrustedUserText },
        ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    let headline: string | null = null;
    try {
        const parsed = JSON.parse(raw) as { headline?: unknown };
        headline = typeof parsed.headline === "string" ? parsed.headline : null;
    } catch {
        headline = null;
    }

    const escaped = headline !== null ? escapeHtml(headline) : null;
    const unsafeAfterEscape =
        escaped !== null && containsDangerousOutput(escaped);

    let reply = escaped;
    let blockedDueToLeak = false;

    if (unsafeAfterEscape) {
        reply = "[Headline withheld: unsafe content after encoding.]";
        blockedDueToLeak = true;
    }

    return { raw, reply, blockedDueToLeak };
}
