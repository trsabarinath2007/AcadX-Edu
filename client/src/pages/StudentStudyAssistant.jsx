import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Code2,
  BrainCircuit,
  RotateCcw
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiPost } from "../api";

export default function StudentStudyAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm AcadX AI Study Assistant. Ask me any academic doubt — concepts, Java, DSA, exam preparation, revision or study planning."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(message = input) {
    const text = message.trim();

    if (!text || loading) return;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: text
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await apiPost(
        "/ai/study",
        {
          message: text,
          history: messages.slice(-8)
        }
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            response?.response ||
            "I couldn't generate a response."
        }
      ]);
    } catch (error) {
      console.error("AI error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Sorry, the AI service is currently unavailable. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared. What would you like to learn?"
      }
    ]);
  }

  return (
    <GenericPage
      title="AI Study Assistant"
      description="Clear academic doubts with your AcadX AI learning assistant."
    >
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">

        {/* SIDEBAR */}

        <div className="space-y-3">

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Sparkles size={20} />
            </div>

            <h2 className="mt-4 font-black text-slate-900">
              AcadX AI
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your academic doubt-clearing assistant.
            </p>
          </div>

          <QuickPrompt
            icon={BookOpen}
            text="Explain a concept"
            onClick={() =>
              sendMessage(
                "Explain a difficult academic concept in simple words."
              )
            }
          />

          <QuickPrompt
            icon={Code2}
            text="Explain my code"
            onClick={() =>
              sendMessage(
                "Help me understand this programming concept step by step."
              )
            }
          />

          <QuickPrompt
            icon={BrainCircuit}
            text="Help me revise"
            onClick={() =>
              sendMessage(
                "Help me revise an important topic for my exam."
              )
            }
          />

          <button
            onClick={clearChat}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Clear conversation
          </button>

        </div>


        {/* CHAT */}

        <div className="flex min-h-[650px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center gap-3 border-b border-slate-100 p-5">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <Sparkles size={18} />
            </div>

            <div>
              <h2 className="font-extrabold">
                Ask AcadX AI
              </h2>

              <p className="text-xs text-slate-500">
                Ask any academic doubt • follow-up questions supported
              </p>
            </div>
          </div>


          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-5">

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-emerald-700 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border bg-white px-4 py-3">
                  <Loader2
                    size={17}
                    className="animate-spin text-emerald-700"
                  />
                </div>
              </div>
            )}

          </div>


          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-slate-100 bg-white p-4"
          >
            <div className="flex items-end gap-2">

              <textarea
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask your academic doubt..."
                className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />

              <button
                disabled={!input.trim() || loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:opacity-40"
              >
                <Send size={17} />
              </button>

            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              Press Enter to send • Shift + Enter for a new line
            </p>
          </form>

        </div>
      </div>
    </GenericPage>
  );
}

function QuickPrompt({
  icon: Icon,
  text,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
    >
      <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
        <Icon size={16} />
      </div>

      <span className="text-xs font-bold text-slate-700">
        {text}
      </span>
    </button>
  );
}