# Description

This project is a **grocery consultant AI** that analyzes a customer’s product history and suggests **top 3 additional products**.

---

## Features

- Extracts products purchased by a specific customer from a local json file.
- Provides **reasoning and observation** for why each product is suggested.
- Outputs a **final verified list** of recommended products.

---

# Environment Configuration & Execution

```bash
git clone https://github.com/your-repo/react-cli-ai-agent.git
```
Create a .env file in the project root directory.

```DIAL_API_KEY=your_api_key_here```

Run the task:

```bash
cd react-cli-ai-agent
npm install
npx ts-node src/task1/index.ts
```

# Examples

Example 1:
```
=== Consultant ===

Thought: The customer has a diverse product history that includes protein (Ground Beef), breakfast items (Cereal), carbohydrates (Potatoes and Pasta). This suggests they may be looking for versatile ingredients that can complement their meals or enhance their breakfast options. I should consider products that can pair well with these items.

Action: I suggest the following additional products:
1. Tomato Sauce
2. Frozen Vegetables
3. Eggs

Observation: 
1. Tomato Sauce is relevant because it pairs well with Ground Beef for making sauces or casseroles, and it can also be used with Pasta for a quick meal.
2. Frozen Vegetables are a great addition as they can be easily incorporated into meals with Ground Beef or Pasta, providing nutrition and variety.
3. Eggs are a versatile protein source that can be used for breakfast alongside Cereal or in various dishes with Potatoes, such as a breakfast hash.

Final Answer: Tomato Sauce, Frozen Vegetables, Eggs

```
Example 2:
```
=== Consultant ===

Thought: The customer has a history of purchasing yogurt, apples, and milk. These items suggest a focus on healthy snacks and breakfast options. Yogurt and milk are dairy products, while apples are a fresh fruit. To complement these items, I should consider products that can be used in breakfast or as healthy snacks, such as granola, honey, or other fruits.

Action: I suggest the following additional products:
1. Granola
2. Honey
3. Bananas

Observation: 
1. Granola is a great addition because it pairs well with yogurt, making for a nutritious breakfast or snack option. It adds texture and flavor, enhancing the yogurt experience.
2. Honey can be used to sweeten yogurt or drizzled over apples for a delicious snack. It adds a natural sweetness that complements the existing products.
3. Bananas are another fruit that can be enjoyed with yogurt or on their own. They are a convenient and healthy snack that fits well with the customer’s current product choices.

Final Answer: Granola, Honey, Bananas

```