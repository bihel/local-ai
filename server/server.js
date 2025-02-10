import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import session from "express-session";
import { Readable } from "stream";

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

/**
 * POST /chat-stream
 * Expects JSON: { message: "Your message here" }
 * Streams the conversation with Ollama.
 */
app.post("/chat-stream", async (req, res) => {
  const { message, model } = req.body;

  res.setHeader("Content-Type", "text/plain");

  const payload = {
    model: model || "deepseek-r1:14b", // Use provided model or fallback to default
    stream: true,
    messages: [{ role: "user", content: message }],
  };

  try {
    const ollamaResponse = await fetch(
      "http://localhost:11434/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const webStream = Readable.toWeb(ollamaResponse.body);
    const reader = webStream.getReader();
    const decoder = new TextDecoder();

    const read = () => {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            res.end();
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
          read(); // Continue reading the next chunk
        })
        .catch((error) => {
          res.write(`Error reading stream: ${error}`);
          res.end();
        });
    };

    read();
  } catch (error) {
    res.status(500).send("Error: " + error.toString());
  }
});

/**
 * POST /chat
 * Expects JSON: { message: "Your message here" }
 * Sends the message to the Ollama API and returns the response.
 */
app.post("/chat", async (req, res) => {
  const { message, model } = req.body;
  try {
    // Initialize the conversation history in the session if not present
    if (!req.session.chatHistory) {
      req.session.chatHistory = [];
    }

    // Append the new user message to the conversation history
    req.session.chatHistory.push({ role: "user", content: message });

    const ollamaPayload = {
      model: model || "deepseek-r1:14b", // Use provided model or fallback to default
      messages: req.session.chatHistory,
    };

    // Forward the request to your local Ollama server
    const response = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaPayload),
    });

    // Parse the JSON response from Ollama
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error contacting Ollama server:", err);
    res.status(500).json({ error: err.toString() });
  }
});

/**
 * GET /models
 * Sends a request to the Ollama API to get the list of available models.
 */
app.get("/models", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/v1/models");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error contacting Ollama server:", err);
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
