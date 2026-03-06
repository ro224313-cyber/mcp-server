import express from "express";
import OpenAI from "openai";
import fs from "fs";
import { readPDF } from "./pdfReader.js";

const app = express();
app.use(express.json());

// Load knowledge base JSON
const knowledgeBase = JSON.parse(
  fs.readFileSync("./knowledge.json", "utf8")
);

// Groq connection
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// MCP Tool
const tools = [
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search answers from company knowledge base",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "User question"
          }
        },
        required: ["query"]
      }
    }
  }
];

// Chat endpoint
app.post("/chat", async (req, res) => {

  const userMessage = req.body.message;

  try {

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "If the user asks company related questions, use the search_knowledge_base tool."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      tools: tools
    });

    const message = response.choices[0].message;

    if (message.tool_calls) {

      const toolCall = message.tool_calls[0];

      if (toolCall.function.name === "search_knowledge_base") {

        const args = JSON.parse(toolCall.function.arguments);
        const query = args.query.toLowerCase();

        let answer = "Sorry, I couldn't find information.";

        // JSON search
        const result = knowledgeBase.find(item =>
          item.question.toLowerCase().includes(query)
        );

        if (result) {
          answer = result.answer;
        }

        // PDF search
        const pdfText = await readPDF();

        if (pdfText.toLowerCase().includes(query)) {
          answer = pdfText.substring(0, 500);
        }

        const secondResponse = await openai.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "user", content: userMessage },
            message,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ answer })
            }
          ]
        });

        return res.json(secondResponse.choices[0].message);
      }
    }

    res.json(message);

  } catch (error) {

    console.error(error);
    res.status(500).send("Error processing request");

  }

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});