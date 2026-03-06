import express from "express";
import OpenAI from "openai";
import fs from "fs";
import { readPDF } from "./pdfReader.js";

const app = express();
app.use(express.json());

// Load JSON knowledge base
const knowledgeBase = JSON.parse(
  fs.readFileSync("./knowledge.json", "utf8")
);

// Load PDF once (performance better)
let pdfText = "";
(async () => {
  pdfText = await readPDF();
})();

// Groq connection
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Chat endpoint
app.post("/chat", async (req, res) => {

  const userMessage = req.body.message.toLowerCase();

  try {

    let answer = null;

    // 1️⃣ Search JSON knowledge
    const result = knowledgeBase.find(item =>
      userMessage.includes(item.question.toLowerCase())
    );

    if (result) {
      answer = result.answer;
    }

    // 2️⃣ Search PDF knowledge
    if (!answer && pdfText.toLowerCase().includes(userMessage)) {
      answer = pdfText.substring(0, 500);
    }

    // 3️⃣ If knowledge found return directly
    if (answer) {
      return res.json({
        content: answer
      });
    }

    // 4️⃣ Otherwise ask AI
    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Answer clearly."
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