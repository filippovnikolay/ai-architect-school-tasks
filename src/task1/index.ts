import "dotenv/config";
import { AzureOpenAI } from "openai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.join(__dirname, "../..", ".env"),
});

const API_KEY = process.env.DIAL_API_KEY;
const MODEL = "gpt-4o-mini-2024-07-18";
const API_VERSION = "2024-02-01";
const ENDPOINT = "https://ai-proxy.lab.epam.com";

if (!API_KEY) {
    throw new Error(
        "Missing credentials. Please set DIAL_API_KEY in your .env file."
    );
}

const client = new AzureOpenAI({
    apiKey: API_KEY,
    apiVersion: API_VERSION,
    endpoint: ENDPOINT,
});

const SYSTEM_PROMPT = `
    ### Initial instructions ###
    You are an AI agent that follows the ReAct (Reason + Act) pattern to solve problems or answer questions step-by-step.
    
    At each step:
    1. Think about the problem.
    2. Decide the next action.
    3. Observe the result of that action.
    4. Continue until the solution is reached.
    
    ### Rules ###
    - Always follow the exact output format below.
    - Repeat the Thought → Action → Observation cycle as needed.
    - Before producing the final answer, perform a self-verification step to check correctness.
    - If solution does not exist for the provided question, type "There is no solution for your question.".
    - If the verification reveals an issue, continue reasoning until the correct solution is found.
    - Stop only when you are confident in the verified result.
    
    ### Output format ###
    Use this format exactly:
    Thought: reasoning about the problem
    Action: the next step to take
    Observation: result of the action
    Final Answer: the final verified solution
`.trim();

async function think(question: string): Promise<string> {
    const response = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: question },
        ],
    });

    return response.choices?.[0]?.message?.content ?? "";
}

async function askQuestion(): Promise<string> {
    const rl = readline.createInterface({ input, output });

    try {
        const question = await rl.question("Enter your question: ");
        return question.trim();
    } finally {
        rl.close();
    }
}

async function main(): Promise<void> {
    const question = await askQuestion();

    if (!question) {
        console.log("No question provided.");
        return;
    }

    const answer = await think(question);

    console.log("\n=== Assistant ===\n");
    console.log(answer);
}

main().catch((err) => {
    console.error("Application error:", err);
    process.exit(1);
});