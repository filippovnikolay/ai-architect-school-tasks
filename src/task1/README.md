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

Thought: The current product list includes yogurt, apples, and milk. These items suggest a focus on healthy snacks and breakfast options. To complement these products, I should consider items that can enhance the use of yogurt and milk, as well as provide additional healthy snacks or breakfast components.

Action: I suggest the following additional products:
1. Granola
2. Honey
3. Oats

Observation: 
1. Granola: This is a great addition because it pairs well with yogurt, making for a nutritious and filling breakfast or snack option. It adds texture and flavor to the yogurt.
2. Honey: This can be used to sweeten yogurt or oatmeal, providing a natural sweetener that complements the flavors of both yogurt and apples.
3. Oats: Oats can be used to make overnight oats with yogurt and milk, creating a wholesome breakfast option. They also provide fiber and can be a healthy addition to smoothies.

Final Answer: Granola, Honey, Oats

```
Example 2:
```
=== Consultant ===

Thought: The customer has a diverse product list that includes protein (Ground Beef), carbohydrates (Cereal, Potatoes, Pasta), and a staple food item (Pasta). To complement these items, I should consider products that can enhance meals or provide additional nutrition. 

Action: I suggest the following top 3 additional products:
1. Tomato Sauce
2. Vegetables (like Bell Peppers or Broccoli)
3. Cheese

Observation: 
1. **Tomato Sauce**: This pairs well with both the Ground Beef and Pasta, allowing for a classic spaghetti dish or a hearty beef stew. It adds flavor and moisture to the meals.
2. **Vegetables**: Adding fresh vegetables can enhance the nutritional value of meals made with Ground Beef and Pasta. They can be sautéed with the beef or served as a side with potatoes.
3. **Cheese**: Cheese can be used in various ways, such as topping pasta dishes or adding flavor to casseroles made with Ground Beef and Potatoes. It also complements the cereal if the customer enjoys savory breakfast options.

Final Answer: Tomato Sauce, Vegetables (like Bell Peppers or Broccoli), Cheese

```