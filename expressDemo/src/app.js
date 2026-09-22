import cors from "cors";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SYSTEM_PROMPT = `You are a customer-support executive for our
premium streetwear and lifestyle e-commerce brand named BSNKing.

Your job is to identify the customer's main problem and urgency.
Answer them clearly and helpfully.

Use professional, friendly language. If the customer has an issue,
use words like "I understand your frustration",
"I am really sorry for the inconvenience", and
"I will help resolve this."

Do not answer any question which is not related to:
- product recommendations
- product availability
- size or fit questions
- order tracking
- shipping delays
- returns and refunds
- payment issues
- account problems
- company policy queries
`;

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../public");

// OpenRouter API key
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Create OpenAI-compatible client for OpenRouter
const client = new OpenAI({
  apiKey: openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",

  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "BSNKing Chat API",
  },
});

// Free OpenRouter model
const model = process.env.OPENROUTER_MODEL ?? "openrouter/free";

// Store conversation history
const history = [];

// Serialize history operations so simultaneous requests
// cannot interfere with each other.
let historyQueue = Promise.resolve();

function useHistory(operation) {
  const result = historyQueue.then(operation);
  historyQueue = result.catch(() => {});
  return result;
}

// Middleware
app.use(cors());
app.use(express.static(publicDir));
app.use(express.text({ type: "*/*" }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Chat API
app.post("/api/chat", async (req, res, next) => {
  if (typeof req.body !== "string") {
    res
      .status(400)
      .type("text/plain")
      .send("Request body must be text");

    return;
  }

  try {
    const answer = await useHistory(async () => {

      // Add user's message to history
      history.push({
        role: "user",
        content: req.body,
      });

      // Send request to OpenRouter
      const apiResponse = await client.chat.completions.create({
        model: model,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...history,
        ],
      });

      // Get AI response
      const content = apiResponse.choices[0]?.message?.content;

      const answerText =
        Array.isArray(content)
          ? content.map((part) => part?.text ?? "").join("")
          : typeof content === "string"
            ? content
            : "";

      // Add AI response to history
      history.push({
        role: "assistant",
        content: answerText,
      });

      return answerText;
    });

    res
      .type("text/plain")
      .send(answer);

  } catch (error) {
    next(error);
  }
});

// Clear conversation history
app.delete("/api", async (_req, res, next) => {
  try {

    await useHistory(async () => {
      history.length = 0;
    });

    res.status(200).send();

  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((error, _req, res, _next) => {

  console.error("API ERROR:");
  console.error(error);

  res
    .status(500)
    .type("text/plain")
    .send("Unable to process the chat request");
});

export default app;