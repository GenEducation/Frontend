import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import hljs from "highlight.js";
// Make sure you import highlight.js CSS and KaTeX CSS once globally in your app:
// import "katex/dist/katex.min.css";
// import "highlight.js/styles/github-dark.css";

/**
 * ChatPage (component mode) — desktop-first, left utility panel
 */
export default function ChatPage({
  sessionId: activeSessionId,
  onSessionCreated,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const textareaRef = useRef(null);
  const messagesRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setSessionId("");
      return;
    }

    setSessionId(activeSessionId); // 🔑 sync local session

    const History = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");

        const res = await fetch("/get-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.username,
            session_id: activeSessionId,
          }),
        });

        if (!res.ok) return;

        const data = await res.json();

        setMessages(
          (Array.isArray(data) ? data : []).map((m, i) => ({
            id: `${activeSessionId}_${i}`,
            role: m.role,
            content: m.content,
          })),
        );
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    History();
  }, [activeSessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus helper — places cursor at end
  const focusInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
  };

  // Clicking message area focuses the input unless clicking an interactive element
  useEffect(() => {
    const wrap = messagesRef.current;
    if (!wrap) return;
    const handler = (e) => {
      if (
        e.target.closest("pre") ||
        e.target.closest("button") ||
        e.target.tagName === "A"
      )
        return;
      focusInput();
    };
    wrap.addEventListener("click", handler);
    return () => wrap.removeEventListener("click", handler);
  }, []);

  // Resize textarea to fit content
  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), role: "user", content: input.trim() };
    const thinkingMsgId = Date.now() + 0.5;

    setMessages((m) => [
      ...m,
      userMsg,
      { id: thinkingMsgId, role: "assistant", typing: true, content: "" },
    ]);

    setInput("");
    resizeTextarea();
    setLoading(true);

    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");

      const res = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMsg.content,
          user_id: user.username || "user",
          session_id: sessionId || null, // null on first message
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let accumulatedResponse = "";
      let receivedSessionId = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            // first chunk may contain session_id
            if (!receivedSessionId && data.session_id) {
              receivedSessionId = true;

              setSessionId(data.session_id);

              if (!activeSessionId && onSessionCreated) {
                onSessionCreated(data.session_id);
              }
            }

            if (data.response) {
              accumulatedResponse += data.response;

              setMessages((m) =>
                m.map((msg) =>
                  msg.id === thinkingMsgId
                    ? { ...msg, typing: false, content: accumulatedResponse }
                    : msg,
                ),
              );
            }
          } catch (err) {
            console.error("Stream parse error", err);
          }
        }
      }
    } catch (err) {
      console.error("send error", err);

      setMessages((m) =>
        m.map((msg) =>
          msg.id === thinkingMsgId
            ? {
              ...msg,
              typing: false,
              content: "Something went wrong. Please try again.",
            }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * CodeBlock renderer for react-markdown:
   * - highlight.js syntax highlighting
   * - Copy button with temporary label change
   */
  function CodeBlock({ inline, className, children, ...props }) {
    const code = String(children).replace(/\n$/, "");
    const language = (className || "").replace("language-", "");
    const [copied, setCopied] = useState(false);

    let highlighted = "";
    try {
      if (language && hljs.getLanguage(language)) {
        highlighted = hljs.highlight(code, { language }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
    } catch {
      // fallback escape
      highlighted = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    const handleCopy = async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } catch {
        // ignore
      }
    };

    return (
      <div className="relative my-3">
        <pre
          className="rounded-md overflow-auto bg-[#071a2a] border border-white/6 text-sm"
          style={{ padding: 12 }}
        >
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 z-10 px-2 py-1 text-[11px] rounded bg-white/6 hover:bg-white/10"
            aria-label="Copy code"
          >
            {copied ? "Copied" : "Copy"}
          </button>

          <code
            className={`hljs ${language ? `language-${language}` : ""}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-[#042E5C] via-[#01354a] to-[#059F6D]">
      <div className="flex-1 flex items-stretch overflow-hidden">
        {/* LEFT utility panel (moved from right to left) */}

        {/* Chat canvas (dominant) */}
        <div className="flex-1 p-8">
          <div className="h-full rounded-2xl bg-[#071f36]/80 border border-white/6 shadow-[0_30px_60px_rgba(2,8,18,0.6)] overflow-hidden flex flex-col">
            {/* Messages area */}
            <div ref={messagesRef} className="flex-1 overflow-y-auto px-6 py-8">
              {isEmpty ? (
                <div
                  className="h-full w-full flex flex-col items-center justify-center px-6"
                  onClick={focusInput}
                  role="button"
                  tabIndex={0}
                >
                  <div className="text-3xl font-extrabold text-white mb-8">
                    Ask me anything…
                  </div>

                  <div className="grid grid-cols-3 gap-4 w-full max-w-[960px]">
                    {[
                      "Explain the Pythagorean theorem with an example",
                      "How do plants make their own food?",
                      "What is an Adjective?",
                      "What is the water cycle?",
                      "What is a Variable?",
                      "Why do we have rules in school and society?",
                    ].map((p, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInput(p);
                          setTimeout(focusInput, 30);
                        }}
                        className={
                          "px-4 py-3 rounded-lg text-sm text-left leading-snug break-words " +
                          "bg-gradient-to-r from-[#05c07a]/90 to-[#2ae3a0]/90 text-[#042E5C] font-medium hover:from-[#05c07a] hover:to-[#2ae3a0] transition"
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 text-sm text-white/60">
                    Click any prompt or anywhere to start typing
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {m.role === "assistant" && (
                        <div className="mr-3 flex-shrink-0">
                          <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-[#05c07a] to-[#2ae3a0] flex items-center justify-center text-[#042E5C] font-semibold">
                            AI
                          </div>
                        </div>
                      )}

                      <div
                        className={`max-w-[72%] rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === "user"
                            ? "bg-[#1e9f6d] text-[#042E5C] ml-auto"
                            : "bg-white/10 text-white"
                          }`}
                      >
                        {m.typing ? (
                          <div className="flex gap-2 items-center py-2">
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                            <span
                              className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                              style={{ animationDelay: "140ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                              style={{ animationDelay: "280ms" }}
                            />
                          </div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => (
                                <p className="text-left mb-2">{children}</p>
                              ),
                              li: ({ children }) => (
                                <li className="text-left ml-4 list-disc">
                                  {children}
                                </li>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-left text-lg font-bold">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-left text-base font-semibold">
                                  {children}
                                </h2>
                              ),
                              code: CodeBlock,
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {m.role === "user" && (
                        <div className="ml-3 flex-shrink-0">
                          <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-xs font-medium text-white/80">
                            U
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/8 px-6 py-5 bg-gradient-to-t from-[#071f36]/80 to-transparent">
              <div
                onClick={focusInput}
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/8"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    resizeTextarea();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask something…"
                  className="flex-1 resize-none bg-transparent outline-none text-sm text-white placeholder:text-white/40 leading-snug"
                  style={{ lineHeight: "1.4" }}
                />

                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className={`px-3 py-2 rounded-full text-sm font-semibold transition ${input.trim()
                      ? "bg-gradient-to-r from-[#05c07a] to-[#2ae3a0] text-[#042E5C]"
                      : "opacity-40 cursor-not-allowed"
                    }`}
                >
                  Send
                </button>
              </div>

              <div className="mt-2 text-xs text-center text-white/40">
                Enter to send • Shift + Enter for newline
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
