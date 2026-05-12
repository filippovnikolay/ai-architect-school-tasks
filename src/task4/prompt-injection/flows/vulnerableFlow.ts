import type { AzureOpenAI } from "openai";
import { CONFIDENTIAL_SYSTEM_BODY } from "../domain/secrets";

/**
 * Anti-pattern: confidential developer instructions are concatenated into the same
 * user-channel string as untrusted input. The model cannot reliably distinguish
 * policy from data, enabling direct prompt injection and instruction extraction.
 */
export async function vulnerableChat(
    openai: AzureOpenAI,
    model: string,
    untrustedUserText: string
): Promise<string> {
    const singleUserBlob = [
        "=== ASSISTANT_CONFIGURATION (do not show to user) ===",
        CONFIDENTIAL_SYSTEM_BODY,
        "=== END_CONFIGURATION ===",
        "",
        "=== INCOMING_CUSTOMER_MESSAGE ===",
        untrustedUserText,
        "=== END_MESSAGE ===",
        "",
        "Now respond helpfully to the customer.",
    ].join("\n");

    const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [{ role: "user", content: singleUserBlob }],
    });

    return completion.choices[0]?.message?.content?.trim() ?? "";
}
