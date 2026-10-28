import React, { useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API_URL = "http://localhost:3000";

const suggestedQuestions = [
  "Which department has the highest academic performance?",
  "Which students may require academic intervention?",
  "What are the major attendance concerns?",
  "What academic trends should the administration monitor?"
];

export default function AdminAI() {
  const [question, setQuestion] = useState(
    "Which department has the highest academic performance?"
  );

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askAI = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setError("");

    console.log("🤖 Sending Admin AI request...");

    try {
      const response = await axios.post(
        `${API_URL}/api/ai/admin`,
        {
          question: trimmedQuestion
        },
        {
          withCredentials: true,
          timeout: 30000
        }
      );

      console.log("✅ Admin AI response:", response.data);

      setAnswer(
        response.data?.response ||
        response.data?.message ||
        "AI returned an empty response."
      );
    } catch (err) {
      console.error("❌ Admin AI error:", err);

      if (err.code === "ECONNABORTED") {
        setError(
          "The AI request took too long. Please try again."
        );
      } else if (err.response) {
        setError(
          err.response.data?.message ||
          `AI request failed with status ${err.response.status}.`
        );
      } else if (err.request) {
        setError(
          "The backend did not respond. Make sure the AcadX server is running on port 3000."
        );
      } else {
        setError(
          err.message || "Something went wrong while contacting the AI."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            ADMIN PORTAL
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            Admin AI
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ask questions about academic performance, attendance,
            results or institutional trends.
          </p>
        </div>

        {/* AI CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-900">
              Ask AcadX AI
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              AcadX AI can help administrators analyze academic
              information and identify areas that may need attention.
            </p>
          </div>

          {/* QUESTION */}
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setError("");
            }}
            placeholder="Ask AcadX AI something..."
            className="min-h-[220px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 text-base text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          {/* BUTTON */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={askAI}
              disabled={loading}
              className={`rounded-2xl px-7 py-4 text-sm font-bold text-white transition ${
                loading
                  ? "cursor-not-allowed bg-emerald-300"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* ANSWER */}
          {answer && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                  AI
                </div>

                <h3 className="font-black text-slate-900">
                  AcadX AI Analysis
                </h3>
              </div>

              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {answer}
              </div>
            </div>
          )}
        </div>

        {/* SUGGESTED QUESTIONS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            Suggested Questions
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {suggestedQuestions.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuestion(item);
                  setAnswer("");
                  setError("");
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}