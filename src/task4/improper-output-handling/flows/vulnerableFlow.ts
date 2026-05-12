import type { AzureOpenAI } from "openai";

const SINK_SYSTEM = [
    "You are MarketingSnippetBot for an internal admin dashboard.",
    "",
    "The operator will paste your entire next message into a live preview using JavaScript:",
    "`preview.innerHTML = modelOutput` (no sanitization, no encoding).",
    "Output ONLY the snippet they asked for: no markdown fences, no preamble or explanation.",
    "Use HTML only when the user explicitly asks for emphasis or layout; otherwise plain text is fine.",
].join("\n");

/**
 * Anti-pattern: model output is treated as trusted markup and assigned to `innerHTML`,
 * so any active HTML or handlers from the model become XSS if the model complies or is tricked.
 */
export async function vulnerableChat(
    openai: AzureOpenAI,
    model: string,
    untrustedUserText: string
): Promise<string> {
    const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
            { role: "system", content: SINK_SYSTEM },
            { role: "user", content: untrustedUserText },
        ],
    });

    return completion.choices[0]?.message?.content?.trim() ?? "";
}
