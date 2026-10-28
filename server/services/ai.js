const axios = require("axios");

/*
==================================================
ACADX AI SERVICE
==================================================
Primary: Gemini REST API (works on Render/cloud).
Fallback: Ollama when explicitly configured/available.
==================================================
*/

const GEMINI_TIMEOUT = Number(process.env.GEMINI_TIMEOUT_MS || 45000);
const OLLAMA_TIMEOUT = Number(process.env.OLLAMA_TIMEOUT_MS || 45000);

function cleanText(value, max = 14000) {
  return String(value || "").trim().slice(0, max);
}

async function askGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url =
    `${process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"}` +
    `/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await axios.post(
    url,
    {
      systemInstruction: {
        parts: [{
          text:
            "You are AcadX AI, a patient, accurate academic assistant. " +
            "Answer the student's actual question directly. Explain step by step, " +
            "use simple language, examples and code when useful. Never invent " +
            "private college data. If the supplied institutional context does not " +
            "contain an answer, say that clearly instead of making it up."
        }]
      },
      contents: [{
        role: "user",
        parts: [{ text: cleanText(prompt, 30000) }]
      }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 1400,
        topP: 0.9
      }
    },
    { timeout: GEMINI_TIMEOUT }
  );

  const text = response.data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

async function askOllama(prompt) {
  const base = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL;

  // Ollama is an optional local fallback, not the primary production AI.
  if (!base || !model) return null;

  const response = await axios.post(
    `${base.replace(/\/$/, "")}/api/generate`,
    {
      model,
      prompt: cleanText(prompt, 30000),
      stream: false,
      options: {
        temperature: 0.25,
        num_predict: 1400
      }
    },
    { timeout: OLLAMA_TIMEOUT }
  );

  const text = response.data?.response?.trim();
  if (!text) throw new Error("Ollama returned an empty response");
  return text;
}

async function generateAIResponse(message, context = "", history = []) {
  const safeMessage = cleanText(message, 8000);
  if (!safeMessage) throw new Error("Message is required");

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((item) => ({
        role: item?.role === "assistant" ? "assistant" : "user",
        content: cleanText(item?.content, 3000)
      }))
    : [];

  const prompt = `
Student's current question:
${safeMessage}

Conversation context:
${safeHistory.length
  ? safeHistory.map((item) => `${item.role.toUpperCase()}: ${item.content}`).join("\n")
  : "No previous conversation."}

Institutional/course context:
${cleanText(context, 14000) || "No private institutional data was supplied."}

Answer requirements:
- Answer the current question, not just the conversation history.
- If it is a follow-up such as "why?", "explain that", or "give an example", use the conversation context.
- Cover the doubt completely and do not stop after a definition.
- For programming/DSA: explain intuition, steps, example, complexity and correct code when requested.
- For academic subjects: explain from basics to the required depth and include an example or analogy where useful.
- For exam questions: give a clear model answer and important points.
- If the question is ambiguous, state the reasonable interpretation and answer it; ask a follow-up only when it is genuinely impossible to answer.
- Do not invent marks, attendance, courses, faculty, schedules or other private institutional facts.
- Keep the response focused and easy to study.
`;

  const errors = [];

  if (process.env.GEMINI_API_KEY) {
    try {
      return await askGemini(prompt);
    } catch (error) {
      console.error("Gemini AI error:", error.response?.data || error.message);
      errors.push(`Gemini: ${error.message}`);
    }
  }

  if (process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) {
    try {
      return await askOllama(prompt);
    } catch (error) {
      console.error("Ollama AI error:", error.response?.data || error.message);
      errors.push(`Ollama: ${error.message}`);
    }
  }

  const configMessage =
    "AI is not configured. Add GEMINI_API_KEY to the server environment " +
    "and restart the server.";
  const error = new Error(configMessage);
  error.code = "AI_NOT_CONFIGURED";
  error.details = errors;
  throw error;
}

module.exports = {
  askGemini,
  askOllama,
  generateAIResponse
};
