import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export type McpSession = {
    client: Client;
    close: () => Promise<void>;
};

/**
 * Spawns an MCP server over stdio.
 */
export async function startMcpSession(
    command: string,
    args: string[]
): Promise<McpSession> {
    const transport = new StdioClientTransport({
        command,
        args,
        stderr: "pipe",
    });
    const client = new Client({ name: "task3-weather-news", version: "1.0.0" });
    await client.connect(transport);
    return {
        client,
        close: async () => {
            await client.close();
        },
    };
}
