# Task 3 — Weather & News Assistant (MCP + Agent Orchestration)

This application answers **current weather** and **latest news** questions by combining:

1. **Agent orchestration** — a small router decides which capability to use, then one or two **tool-using specialists** run.
2. **Model Context Protocol (MCP)** — two separate MCP servers run as child processes and expose tools over **stdio** (the same pattern Cursor or Claude Desktop uses).

There is no custom HTTP weather or news client in the app logic: live data comes **only** through MCP tool calls.

---

## High-level architecture

```mermaid
flowchart TB
    subgraph entry["Entry points"]
        M["main.ts — demo question"]
        E["test/main.ts — evaluation suite"]
    end

    subgraph runtime["Runtime"]
        O["orchestrateAnswer"]
        R["routeQuestion — router LLM"]
        W["runToolAgent + weather MCP"]
        N["runToolAgent + news MCP"]
        MERGE["Merge LLM — only if domain = both"]
    end

    subgraph mcp["MCP servers (stdio)"]
        OM["open-meteo-mcp-server\n(Open-Meteo API)"]
        RSS["rss-reader-mcp\n(RSS / Atom feeds)"]
    end

    subgraph cloud["Azure OpenAI (EPAM proxy)"]
        LLM["Chat completions"]
    end

    M --> O
    E --> O
    O --> R
    R --> LLM
    O --> W
    O --> N
    O --> MERGE
    MERGE --> LLM
    W --> LLM
    N --> LLM
    W <--> OM
    N <--> RSS
```

---

## How a single question flows through the system

### Step 1 — Start MCP sessions

`main.ts` (and `test/main.ts`) call `withMcpSessions`, which:

1. Spawns **`npx -y open-meteo-mcp-server`** and connects an MCP `Client` over stdio.
2. Spawns **`npx -y rss-reader-mcp`** and connects a second `Client`.

Implementation: `mcp/mcpSession.ts` (`StdioClientTransport` from `@modelcontextprotocol/sdk`).

### Step 2 — Orchestrator (`agents/orchestrator.ts`)

`orchestrateAnswer` is the single public orchestration API:

1. Calls **`routeQuestion`** once (router pass).
2. Branches on `route.domain`:
   - **`weather`** — one `runToolAgent` using only the **weather** MCP client and a small allowlisted tool set.
   - **`news`** — one `runToolAgent` using only the **news** MCP client.
   - **`both`** — runs **weather** then **news** specialists **sequentially**, then a **merge** chat completion that turns the two plain-text briefs into one answer (no extra MCP in the merge step).

### Step 3 — Router (`agents/router.ts`)

The router is **not** a tool-calling agent. It is one chat completion whose output is constrained by **`response_format`** using **`json_schema`** (structured outputs):

- `domain`: `"weather" | "news" | "both"`
- `rationale`: short explanation string

The system prompt describes the three categories; the **JSON shape** is enforced by the API schema, not by asking the model for “free-form JSON” in prose.

### Step 4 — Specialist tool loop (`agents/toolRunner.ts`)

`runToolAgent` implements a **ReAct-style** loop (up to 8 iterations by default):

1. **`listTools`** on the MCP server, then filter by an **allowlist** from `config.ts`.
2. Convert each allowed MCP tool into an OpenAI **`function`** tool (name, description, JSON Schema parameters from MCP).
3. Call **`chat.completions.create`** with `tools` and `tool_choice: "auto"`.
4. If the model returns **`tool_calls`**, execute each via **`mcpClient.callTool`**, append **`role: "tool"`** messages with truncated text content, and repeat.
5. If the model returns **plain `content`** with no tool calls, that text is the specialist’s **brief** (final answer for single-domain, or input to merge for `both`).

The flow is split into two sequence diagrams so it matches the code: `weather`, `news`, and `both` use different orchestration paths; **`mcpClient.callTool` runs only when the model returns `tool_calls`**, not on every ReAct iteration; for `both` (a **separate** merge step calls the LLM with **no** tools (only the two text briefs)).

**Orchestrator** (who talks to whom):
**`runToolAgent` — one specialist pass** (same pattern for weather or news; wired to **one** MCP `Client`):



## Configuration (`config.ts`)

| Constant | Purpose |
|----------|---------|
| `DEFAULT_NEWS_RSS_URL` | Default BBC World RSS URL passed in the news specialist system prompt (no news API key). |
| `WEATHER_TOOL_ALLOWLIST` | `geocoding`, `weather_forecast` — the Open-Meteo server exposes many tools; only these are given to the model to keep context small and behavior predictable. |
| `NEWS_TOOL_ALLOWLIST` | `fetch_feed_entries` — headlines from any RSS URL the model passes (default feed is BBC World). |
| `NPX_COMMAND` / `OPEN_METEO_MCP_ARGS` / `RSS_READER_MCP_ARGS` | How MCP servers are launched. |
| `deploymentName()` | Reads `AZURE_OPENAI_DEPLOYMENT` or `OPENAI_DEPLOYMENT`, else defaults to `gpt-4.1-mini-2025-04-14`. |


## Entry points

| Script | Path | What it does |
|--------|------|----------------|
| App demo | `main.ts` | Hardcoded `hardcodedQuestion`, prints route, tools, and final answer. Run: `npm run task3` or `npx ts-node src/task3/main.ts`. |
| Evaluation | `test/main.ts` | Runs the full pipeline on every row in `test/evalDataset.ts`, prints **routing accuracy** and **tool appropriateness**. Run: `npm run task3:eval` or `npx ts-node src/task3/test/main.ts`. |

---

## Evaluation (`test/`)

- **`test/evalDataset.ts`** — labeled queries: expected router domain (`weather` / `news` / `both`) and optional expected MCP tool names (or **tool groups** for the combined case: at least one weather tool and `fetch_feed_entries`).
- **`test/runEvaluation.ts`** — for each case, calls `orchestrateAnswer`, records predicted domain and tool trace, then aggregates:
  - **Routing accuracy** — fraction of cases where `route.domain` matches `expectedDomain`.
  - **Tool appropriateness** — fraction of cases (with tool expectations) where the trace includes the required tool(s).

Weather “gold” labels are **behavioral** (which tools should run), not exact numeric forecasts, because live weather changes.

---

## Evaluation Run
```aiignore

=== Test Execution ===

Routing accuracy: 100.0% (7/7)
Tool appropriateness: 100.0% (cases that require specific MCP tools)

Per-case:

[w-paris] route OK | tools OK
  query: What is the current weather and short forecast for Paris, France?
  predicted=weather expected=weather
  tools: geocoding, weather_forecast
  answer: The current weather in Paris, France is partly cloudy with a temperature of 21.9°C. The wind is blowing at 8 km/h from the north-northeast (8°). There is no precipitation at the moment.

For the short forecast:
- Today, the temperature will range from a low of 10°C to a high of 22.4°C with partly cloudy skies and no precipitation expected.
- Tomorrow, the temperature will range from 10.1°C to 20.8°C, also with partly cloudy skies and no precipitation expected.

[w-berlin] route OK | tools OK
  query: Will it rain in Berlin tomorrow?
  predicted=weather expected=weather
  tools: geocoding, weather_forecast
  answer: There is no expected rainfall in Berlin tomorrow. The precipitation sum forecast for tomorrow is 0 mm.

[n-headlines] route OK | tools OK
  query: Give me the latest BBC world news headlines.
  predicted=news expected=news
  tools: fetch_feed_entries
  answer: Here are the latest BBC world news headlines:

1. "What we're learning about suspected Washington press dinner gunman" - Apr 27, 2026
2. "Trump says King will be 'very safe' during US visit after security talks" - Apr 27, 2026
3. "Colombia offers record $1.4m-reward for rebel it blames for deadly bomb attack" - Apr 27, 2026
4. "Russian fighters confirm withdrawal from northern Mali city after separatist attacks" - Apr 27, 2026
5. "Michael Jackson biopic smashes box office record" - Apr 27, 2026

Would you like more details on any of these?

[n-topic] route OK | tools OK
  query: What stories appear in the world news RSS feed right now?
  predicted=news expected=news
  tools: fetch_feed_entries
  answer: Here are some of the latest stories from the world news RSS feed:

1. "What we're learning about suspected Washington press dinner gunman" - The man arrested at the event attended by President Trump is due in court on Monday. (Published: Mon, 27 Apr 2026 11:56:08 GMT)
2. "Trump says King will be 'very safe' during US visit after security talks" - The state visit will go ahead despite concerns raised after a gunman targeted an event attended by the president. (Published: Mon, 27 Apr 2026 09:19:11 GMT)
3. "Colombia offers record $1.4m-reward for rebel it blames for deadly bomb attack" - Officials say a rebel leader known as "Marlon" ordered the attack in which 20 people were killed. (Published: Mon, 27 Apr 2026 11:42:59 GMT)
4. "Russian fighters confirm withdrawal from northern Mali city after separatist attacks" - Ethnic Tuareg fighters say they are in control of Kidal following a weekend of nationwide attacks, alongside Islamist groups. (Published: Mon, 27 Apr 2026 12:36:17 GMT)
5. "Michael Jackson biopic smashes box office record" - The film received poor reviews but has stormed the box office, taking $217m (£160m) globally. (Published: Mon, 27 Apr 2026 09:44:09 GMT)
6. "At least 42 killed in Chad after water well dispute escalates" - The dispute was initially between two families before escalating into a cycle of reprisal attacks. (Published: Mon, 27 Apr 2026 09:20:50 GMT)
7. "Kim Jong Un opens memorial for N Korean soldiers killed in Ukraine war" - Kim Jong Un and Russian Defence Minister Andrey Belousov unveiled the memorial in Pyongyang. (Published: Mon, 27 Apr 2026 06:52:59 GMT)
8. "Pirates seize another vessel off Somali coast as threat level increased" - The UK's maritime monitor reports at least four suspected piracy incidents in the past week off the coast of Somalia. (Published: Mon, 27 Apr 2026 06:53:54 GMT)
9. "Archbishop praises Pope's anti-war comments during Vatican visit" - Dame Sarah Mullally, the first female head of the Church of England, had a private discussion with Pope Leo during the trip. (Published: Mon, 27 Apr 2026 11:19:25 GMT)
10. "French teen who licked vending machine straw faces jail in Singapore" - The teen, who posted on social media a video of himself licking the straw, could be jailed for more than two years. (Published: Mon, 27 Apr 2026 06:40:22 GMT)

Would you like more details on any of these stories?

[b-combo] route OK | tools OK
  query: I need both: weather in London today and the latest BBC world headlines.
  predicted=both expected=both
  tools: geocoding, geocoding, weather_forecast, fetch_feed_entries, fetch_feed_entries
  answer: Today's weather in London is partly cloudy with a current temperature of 20.4°C and no precipitation. Light rain showers are expected, with temperatures ranging from a low of 10°C to a high of 21°C. Winds are coming from the northeast at about 5 km/h (or 5 mph), visibility is very good, humidity is 37%, UV risk is moderate at level 6, and pollution levels are moderate. Sunrise was at 05:41 BST and sunset will be at 20:17 BST.

Regarding the latest BBC world headlines, I do not have access to live news feeds. For the most recent headlines, please check the official BBC website or a news app. If you need any other information, feel free to ask!

[w-london-implicit] route OK | tools OK
  query: Is it warm enough to walk outside in London this afternoon?
  predicted=weather expected=weather
  tools: geocoding, weather_forecast
  answer: In London this afternoon, the temperature is currently around 20.4°C, which is generally warm enough for a comfortable walk outside. The weather code 3 indicates partly cloudy conditions. So yes, it is warm enough to walk outside in London this afternoon.

[n-generic] route OK | tools OK
  query: Summarize top international news from the default RSS feed.
  predicted=news expected=news
  tools: fetch_feed_entries
  answer: Here are the top international news headlines from the BBC World News feed:

1. "What we're learning about suspected Washington press dinner gunman" - The man arrested at the event attended by President Trump is due in court on Monday. (Published: 27 April 2026)

2. "Trump says King will be 'very safe' during US visit after security talks" - The state visit will go ahead despite concerns raised after a gunman targeted an event attended by the president. (Published: 27 April 2026)

3. "Colombia offers record $1.4m-reward for rebel it blames for deadly bomb attack" - Officials say a rebel leader known as "Marlon" ordered the attack in which 20 people were killed. (Published: 27 April 2026)

4. "Russian fighters confirm withdrawal from northern Mali city after separatist attacks" - Ethnic Tuareg fighters say they are in control of Kidal following a weekend of nationwide attacks, alongside Islamist groups. (Published: 27 April 2026)

5. "Michael Jackson biopic smashes box office record" - The film received poor reviews but has stormed the box office, taking $217m (£160m) globally. (Published: 27 April 2026)

```


