import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { AzureOpenAI } from "openai";
import type {
    ChatCompletionMessageParam,
    ChatCompletionTool,
} from "openai/resources/chat/completions";

export type ToolRunResult = {
    assistantText: string;
    toolsCalled: string[];
};

async function mcpToolsToOpenAI(
    client: Client,
    allowlist: Set<string>
): Promise<ChatCompletionTool[]> {
    const {tools} = await client.listTools();
    return tools
        .filter((t) => allowlist.has(t.name))
        .map((t_1) => ({
            type: "function" as const,
            function: {
                name: t_1.name,
                description: (t_1.description ?? "").slice(0, 8000),
                parameters: (t_1.inputSchema ?? {
                    type: "object",
                    properties: {},
                }) as Record<string, unknown>,
            },
        }));
}

/**
 * Single-agent ReAct-style loop: the model may call MCP tools until it returns a final text answer.
 */
export async function runToolAgent(
    openai: AzureOpenAI,
    deployment: string,
    mcpClient: Client,
    allowlist: Set<string>,
    systemPrompt: string,
    userMessage: string,
    options?: {
        maxIterations?: number;
        onToolCall?: (name: string, args: unknown) => void;
    }
): Promise<ToolRunResult> {
    const maxIterations = options?.maxIterations ?? 8;
    const tools = await mcpToolsToOpenAI(mcpClient, allowlist);
    if (tools.length === 0) {
        throw new Error("No MCP tools available after allowlist filter.");
    }

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
    ];
    const toolsCalled: string[] = [];

    for (let i = 0; i < maxIterations; i++) {
        const completion = await openai.chat.completions.create({
            model: deployment,
            messages,
            tools,
            tool_choice: "auto",
            temperature: 0.2,
        });

        const choice = completion.choices[0]?.message;
        if (!choice) {
            throw new Error("Empty completion choice.");
        }

        const toolCalls = choice.tool_calls;
        if (!toolCalls?.length) {
            const text = choice.content?.trim() ?? "";
            return { assistantText: text, toolsCalled };
        }

        messages.push({
            role: "assistant",
            content: choice.content,
            tool_calls: toolCalls,
        });

        for (const tc of toolCalls) {
            if (tc.type !== "function") {
                continue;
            }
            const name = tc.function.name;
            let args: Record<string, unknown> = {};
            try {
                args = JSON.parse(tc.function.arguments || "{}") as Record<
                    string,
                    unknown
                >;
            } catch {
                args = {};
            }
            toolsCalled.push(name);
            options?.onToolCall?.(name, args);

            const result = await mcpClient.callTool({
                name,
                arguments: args,
            });

            const textContent = (result.content as { type: string; text?: string }[])
                .filter((c) => c.type === "text")
                .map((c) => c.text ?? "")
                .join("\n");

            messages.push({
                role: "tool",
                tool_call_id: tc.id,
                content:
                    textContent.slice(0, 24_000) ||
                    JSON.stringify(result.content).slice(0, 24_000),
            });
        }
    }

    return {
        assistantText:
            "Stopped after maximum tool iterations without a final answer.",
        toolsCalled,
    };
}
