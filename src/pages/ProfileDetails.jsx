import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* -------------------- helpers -------------------- */
function normalizeValue(raw) {
  if (!raw) return [];
  const s = String(raw).trim();

  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  if (s.includes(",")) return s.split(",").map((v) => v.trim());
  if (s.includes("\n")) return s.split("\n").map((v) => v.trim());
  return [s];
}

/* -------------------- component -------------------- */
export default function ProfileDetails() {
  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const navigate = useNavigate();

  /* -------- auth + data -------- */
  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (!raw) return navigate("/auth");

    const parsed = JSON.parse(raw);
    setUser(parsed);

    fetch("/all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: parsed.username }),
    })
      .then((r) => r.json())
      .then((d) => {
        const res =
          d?.all_memories_for_user?.results || d?.results || d?.memories || [];
        setMemories(res);
      });
  }, [navigate]);

  const memoryMap = useMemo(() => {
    const m = {};
    memories.forEach((mem) => {
      const key = mem.category || mem?.metadata?.category;
      if (!key) return;
      m[key.toLowerCase()] = mem.content || mem.text || mem.memory;
    });
    return m;
  }, [memories]);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  const strengths = normalizeValue(memoryMap.strengths);
  const likes = normalizeValue(memoryMap.likes);
  const dislikes = normalizeValue(memoryMap.dislikes);
  const weaknesses = normalizeValue(memoryMap.weaknesses);
  const learning = normalizeValue(memoryMap.learning_style);
  const grasping = normalizeValue(memoryMap.grasping_style);

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen w-screen grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden text-white">
      {/* FULL BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-br from-[#042E5C] via-[#01354a] to-[#059F6D]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#00182740_0%,#00182700_55%)]" />
      </div>

      {/* LEFT HERO */}
      {/* LEFT HERO – CLEAN VERSION */}
      <section className="relative z-100 lg:col-span-4 flex items-center px-8 lg:px-12 py-28">
        <div className="w-full max-w-md">
          {/* Soft container */}
          <div className="rounded-3xl bg-[#041a2f]/70 border border-white/10 p-10 shadow-2xl">
            {/* Avatar + Name */}
            <div className="flex items-center gap-5 mb-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#05c07a] to-[#2ae3a0] flex items-center justify-center text-[#042E5C] text-2xl font-extrabold relative overflow-hidden">
                {initials}
                <img
                  src={`/${user.username}.png`}
                  alt={user.username}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold leading-tight">
                  {memoryMap.name || user.username}
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {memoryMap.grade_age || "Learner Profile"}
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-4xl font-extrabold leading-tight">
              Your Learning
              <br />
              Blueprint 🚀
            </h2>

            {/* Description */}
            <p className="mt-5 text-base text-white/80 leading-relaxed">
              This profile helps GenEd personalize explanations, examples, and
              pacing to match how you learn best.
            </p>

            {/* Actions */}
            <div className="mt-10 flex gap-4">
              <button
                onClick={() => navigate("/stream")}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition text-sm"
              >
                ← Back to Chat
              </button>

              <button
                onClick={() => {
                  sessionStorage.clear();
                  navigate("/auth");
                }}
                className="px-6 py-3 rounded-full font-semibold text-[#042E5C] bg-gradient-to-r from-[#05c07a] to-[#2ae3a0] text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PROFILE CARD */}
      <aside className="relative z-10 lg:col-span-7 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-5xl">
          <div className="relative rounded-3xl bg-[#061426]/90 border border-white/10 shadow-2xl p-10 lg:p-14 overflow-hidden">
            {/* soft glow */}
            <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#06314a] to-[#0b5d4b] opacity-20 blur-3xl" />

            {/* OVERVIEW */}
            <div className="mb-10">
              <span className="px-4 py-2 rounded-full bg-[#042E5C]/40 text-[#6dffb5] font-bold uppercase text-xs tracking-wider">
                Profile Overview
              </span>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  ["Archetype", "The Logician"],
                  ["Language", memoryMap.language || "English"],
                  ["Tone", memoryMap.tone_preference],
                  ["Recent Context", memoryMap.recent_context],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-[#041729]/70 border border-white/10 rounded-xl p-4"
                  >
                    <div className="text-xs uppercase text-white/50">{k}</div>
                    <div className="font-semibold mt-1">{v || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ["Strengths", strengths],
                ["Likes", likes],
                ["Dislikes", dislikes],
              ].map(([title, list]) => (
                <div
                  key={title}
                  className="bg-[#041729]/70 border border-white/10 rounded-xl p-6"
                >
                  <div className="text-[#05c07a] font-bold uppercase text-sm mb-3">
                    {title}
                  </div>
                  {list.length ? (
                    <ul className="space-y-2">
                      {list.map((v, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-[#05c07a]">•</span>
                          {v}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-white/40 italic">Not provided</span>
                  )}
                </div>
              ))}

              {/* LEARNING */}
              <div className="bg-[#041729]/70 border border-white/10 rounded-xl p-6">
                <div className="text-[#05c07a] font-bold uppercase text-sm mb-3">
                  Learning & Grasping
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase text-white/50">Style</div>
                    {learning.join(", ") || "—"}
                  </div>
                  <div>
                    <div className="text-xs uppercase text-white/50">
                      Grasping
                    </div>
                    {grasping.join(", ") || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* CONTEXT */}
            <div className="mt-6 bg-[#041729]/70 border border-white/10 rounded-xl p-6">
              <div className="text-[#05c07a] font-bold uppercase text-sm mb-2">
                Context & Notes
              </div>
              <b>Weaknesses:</b> {weaknesses.join(", ") || "—"}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
