import express from "express";
import OpenAI from "openai";
import fs from "fs";
import { readPDF } from "./pdfReader.js";
import { readDOC } from "./docReader.js";

const app = express();
app.use(express.json());

// Load JSON knowledge base
const knowledgeBase = JSON.parse(
  fs.readFileSync("./knowledge.json", "utf8")
);

// Load PDF
let pdfText = "";
(async () => {
  pdfText = await readPDF();
})();

// Load DOCX
let docText = "";
(async () => {
  docText = await readDOC();
})();

// Groq connection
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

app.post("/chat", async (req, res) => {

  const userMessage = req.body.message;

  try {

    let answer = null;

    // 1️⃣ JSON search
    const result = knowledgeBase.find(item =>
      userMessage.toLowerCase().includes(item.question.toLowerCase())
    );

    if (result) {
      answer = result.answer;
    }

    // 2️⃣ PDF search
    if (!answer && pdfText.toLowerCase().includes(userMessage.toLowerCase())) {
      answer = pdfText.substring(0, 500);
    }

    // 3️⃣ DOC knowledge search using AI
    if (!answer && docText) {

      const context = docText.substring(0, 5000);

      const response = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are an AI assistant that answers questions ONLY from the knowledge base.

If the answer is not in the knowledge base, say:
"Information not found in knowledge base."

Knowledge Base:
${context}
`
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      });

      const docAnswer = response.choices[0].message.content;

      if (!docAnswer.toLowerCase().includes("not found")) {
        answer = docAnswer;
      }
    }

    // 4️⃣ If answer found
    if (answer) {
      return res.json({
        content: answer
      });
    }

    // 5️⃣ AI fallback
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      content: response.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});