import "dotenv/config";
import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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
    You are a grocery consultant AI that helps customers discover relevant products. 
    Your goal is to suggest the top 3 additional products based on a customer’s product history.
    
    ### Rules ###
    - Always follow the Thought → Action → Observation cycle.
    - Repeat Thought → Action → Observation as needed until you are confident in your recommendations.
    - Base all suggestions on the customer’s product history; do NOT guess unrelated products.
    - Comment on why each additional product is relevant in the Observation step.
    
    ### Output format ###
    Use this format exactly:
    
    Thought: your reasoning about the customer’s current product history and possible complementary items
    Action: suggest the top 3 additional products for the customer
    Observation: comment on why each suggested product is relevant
    Final Answer: the final recommended list of 3 products
`.trim();

async function suggestExtraProducts(productList: string[]): Promise<string> {
    const response = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Could you suggest me additional products based on my product history: 
        ${productList.join(',')}` },
        ],
    });

    return response.choices?.[0]?.message?.content ?? "";
}

interface Transaction {
    customer_id: string;
    store_name: string;
    transaction_date: string;
    aisle: string;
    product_name: string;
    quantity: string;
    unit_price: number;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    loyalty_points: number;
}

export function getProductList(customerId: string): string[] {
    const dataPath = path.join(__dirname, "data/transactions.json");
    const transactions: Transaction[] = JSON.parse(
        fs.readFileSync(dataPath, "utf-8")
    );

    const products: string[] = transactions
        .filter(t => t.customer_id === customerId)
        .map(t => t.product_name);

    return Array.from(new Set(products));
}

async function main(): Promise<void> {
    // 8381, 2020, 2494, 3068
    const answer = await suggestExtraProducts(getProductList("8381"));

    console.log("\n=== Consultant ===\n");
    console.log(answer);
}

main().catch((err) => {
    console.error("Application error:", err);
    process.exit(1);
});