import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * LeftPanel
 * - Fetches chat sessions
 * - Emits selected session_id
 * - ChatGPT/Gemini-style sidebar behavior
 */
export default function LeftPanel({
  activeTab = "chat",
  activeSessionId,
  onTabChange = () => {},
  onNewChat = () => {},
  onSelectSession = () => {},
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      setUser(userData);

      const res = await fetch("/get-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userData.user_id || "",
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FETCH SESSIONS ---------------- */
  useEffect(() => {
    fetchSessions();
  }, []);

  /* ---------------- RE-FETCH IF NEW SESSION ---------------- */
  const checkedSessionIds = useRef(new Set());

  useEffect(() => {
    if (
      activeSessionId &&
      !sessions.some((s) => s.session_id === activeSessionId)
    ) {
      if (!checkedSessionIds.current.has(activeSessionId)) {
        checkedSessionIds.current.add(activeSessionId);
        fetchSessions();
      }
    }
  }, [activeSessionId, sessions]);

  /* ---------------- SELECT SESSION ---------------- */
  const selectSession = (sessionId) => {
    onSelectSession(sessionId);
  };

  return (
    <aside
      className="w-[320px] h-full flex flex-col
                 bg-[#07121a]/60 backdrop-blur-md
                 border-r border-white/6
                 px-6 py-6"
    >
      {/* BRAND */}
      <div className="mb-8 select-none flex justify-center">
        <img
          src="/GenEd Logo Colored.svg"
          alt="GenEd"
          className="w-48 h-auto"
        />
      </div>

      {/* SESSION INFO */}
      <div className="mb-6">
        <div className="text-sm font-semibold mb-1">Session</div>
        <div className="text-xs text-white/70">
          Mode: {activeTab === "chat" ? "Chat" : "Voice"}
        </div>
      </div>

      {/* NEW CHAT */}
      <button
        onClick={onNewChat}
        className="mb-6 w-full px-3 py-2 rounded-lg
                   text-sm font-medium
                   bg-gradient-to-r from-[#05c07a] to-[#2ae3a0]
                   text-[#042E5C]
                   hover:brightness-105 transition
                   focus:outline-none focus:ring-2 focus:ring-[#05c07a]/30"
      >
        + New Chat
      </button>

      {/* MODE SWITCH */}
      <div className="flex flex-col gap-1 mb-8">
        <SideTab
          label="Chat"
          active={activeTab === "chat"}
          onClick={() => onTabChange("chat")}
        />
        <SideTab
          label="Voice"
          active={activeTab === "stream"}
          onClick={() => onTabChange("stream")}
        />
      </div>

      {/* SESSIONS LIST */}
      <div className="flex-1 overflow-hidden">
        <div className="text-sm font-semibold mb-3">Recent Conversations</div>

        <div className="flex flex-col gap-2 max-h-full overflow-y-auto pr-1">
          {loading && (
            <div className="text-xs text-white/40">Loading sessions…</div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="px-3 py-2 rounded-lg bg-white/5 text-xs text-white/60">
              No previous conversations
            </div>
          )}

          {sessions.map((s) => {
            const isActive = activeSessionId === s.session_id;

            return (
              <button
                key={s.session_id}
                onClick={() => selectSession(s.session_id)}
                title={s.session_id}
                className={`px-3 py-2 rounded-lg text-xs text-left truncate transition
                  ${
                    isActive
                      ? "bg-white/15 text-white font-medium"
                      : "bg-white/5 hover:bg-white/10 text-white/80"
                  }`}
              >
                {s.title || s.session_id || "Conversation"}
              </button>
            );
          })}
        </div>
      </div>

      {/* USER PROFILE */}
      {user && (
        <div className="mt-4 pt-4 border-t border-white/10 group relative">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 w-full text-left focus:outline-none hover:bg-white/5 p-2 rounded-lg transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#05c07a] to-[#2ae3a0] flex items-center justify-center text-[#042E5C] font-bold text-sm shrink-0 shadow-lg relative overflow-hidden">
              {(() => {
                const name = user.username || "Guest";
                const parts = name.trim().split(/\s+/);
                if (parts.length >= 2) {
                  return (parts[0][0] + parts[1][0]).toUpperCase();
                }
                return name.slice(0, 1).toUpperCase();
              })()}
              <img
                src={`/${user.username}.png`}
                alt={user.username}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.username || "Guest"}
              </div>
              <div className="text-xs text-white/50 truncate">
                {user.email || "No email"}
              </div>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}

/* ---------- SideTab ---------- */
function SideTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`w-full text-left px-3 py-2 rounded-md
                  text-sm transition
                  ${
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/65 hover:bg-white/5"
                  }
                  focus:outline-none focus:ring-1 focus:ring-white/10`}
    >
      {label}
    </button>
  );
}
