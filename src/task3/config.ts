/** Default BBC World RSS — no API key (used via rss-reader-mcp). */
export const DEFAULT_NEWS_RSS_URL =
    "https://feeds.bbci.co.uk/news/world/rss.xml";

/** Tools exposed to the weather specialist (Open‑Meteo MCP, no API key). */
export const WEATHER_TOOL_ALLOWLIST = new Set([
    "geocoding",
    "weather_forecast",
]);

/** Tools exposed to the news specialist (RSS MCP, no API key). */
export const NEWS_TOOL_ALLOWLIST = new Set(["fetch_feed_entries"]);

export const NPX_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";

export const OPEN_METEO_MCP_ARGS = ["-y", "open-meteo-mcp-server"];
export const RSS_READER_MCP_ARGS = ["-y", "rss-reader-mcp"];

export function deploymentName(): string {
    return (
        process.env.AZURE_OPENAI_DEPLOYMENT ??
        process.env.OPENAI_DEPLOYMENT ??
        "gpt-4.1-mini-2025-04-14"
    );
}
