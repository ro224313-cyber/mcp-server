import express from "express";
import OpenAI from "openai";
import { readDOC } from "./docReader.js";

const app = express();
app.use(express.json());

let docText = "";

(async () => {
  docText = await readDOC();
})();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

app.post("/chat", async (req, res) => {

  const question = req.body.message;

  try {

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are an assistant answering questions from a company knowledge base.

Use ONLY the information provided below.

Knowledge Base:
${docText.substring(0,6000)}
`
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    res.json({
      content: response.choices[0].message.content
    });

  } catch (err) {

    console.error(err);
    res.status(500).send("Error");

  }

});

app.listen(3000, () => {
  console.log("Server running");
});