# Description

This project demonstrates a minimal **AI agent CLI tool** that interacts with an Azure OpenAI-compatible API.

The assistant uses the **ReAct reasoning pattern**, where the model explains its reasoning process using the following structured format:

- Thought
- Action
- Observation
- Final Answer

This approach encourages the model to reason step-by-step before producing the final result.

The application:

- Reads a question from the command line
- Sends the prompt to an Azure OpenAI endpoint
- Returns a structured reasoning response
- Displays the answer in the terminal

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

Question:
```
Solve the linear equations: 10x - 1 = 15 - 6x
```

Output:
```
=== Assistant ===

Thought: I need to solve the linear equation \(10x - 1 = 15 - 6x\). To do this, I will first isolate the variable \(x\) on one side of the equation.

Action: I will add \(6x\) to both sides of the equation to combine the \(x\) terms.

Observation: The equation becomes \(10x + 6x - 1 = 15\), which simplifies to \(16x - 1 = 15\).

Thought: Now, I need to isolate \(16x\) by adding \(1\) to both sides of the equation.

Action: I will add \(1\) to both sides.

Observation: The equation now is \(16x = 15 + 1\), which simplifies to \(16x = 16\).

Thought: Next, I will solve for \(x\) by dividing both sides of the equation by \(16\).

Action: I will divide both sides by \(16\).

Observation: The equation simplifies to \(x = 1\).

Thought: I will verify the solution by substituting \(x = 1\) back into the original equation to ensure both sides are equal.

Action: Substitute \(x = 1\) into the original equation \(10x - 1 = 15 - 6x\).

Observation: The left side becomes \(10(1) - 1 = 10 - 1 = 9\) and the right side becomes \(15 - 6(1) = 15 - 6 = 9\). Both sides are equal.

Final Answer: The final verified solution is \(x = 1\).
```
---

Question (no solution):

```
Solve the linear equations: x = 5 + x
```

Answer:
```
=== Assistant ===

Thought: The equation given is x = 5 + x. To solve for x, I need to isolate x on one side of the equation. 

Action: Subtract x from both sides of the equation to simplify it. 

Observation: The equation becomes 0 = 5, which is a contradiction. 

Thought: Since 0 = 5 is not a true statement, it indicates that there is no value of x that can satisfy the original equation. 

Final Answer: There is no solution for your question.
```
