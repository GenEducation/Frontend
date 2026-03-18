import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css"; // small extra CSS (font + helper shadows)
import { AUTH_API_BASE, getFullUrl } from "../api/apiConfig";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    grade: "",
    school_board: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    const endpoint = isLogin ? "/sign-in" : "/sign-up";
    const url = getFullUrl(AUTH_API_BASE, endpoint);

    const payload = isLogin
      ? { username: formData.username, password: formData.password }
      : {
          username: formData.username,
          email_id: formData.email,
          password: formData.password,
          age: parseInt(formData.age, 10),
          grade: parseInt(formData.grade, 10),
          school_board: formData.school_board,
        };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to read JSON / fallback to status text
        const txt = await res.text();
        throw new Error(txt || `Request failed ${res.status}`);
      }

      const data = await res.json();

      if (isLogin) {
        if (data?.status === "success") {
          setStatus("Login successful — redirecting...");
          sessionStorage.setItem("user", JSON.stringify(data));
          navigate("/stream");
        } else {
          setStatus("Login failed: check credentials.");
        }
      } else {
        if (Array.isArray(data) && data[0]?.toLowerCase().includes("success")) {
          setStatus("Signup successful! Please sign in.");
          setIsLogin(true);
        } else {
          setStatus("Signup failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setStatus("Server error — ensure the auth service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12">
      {/* Decorative full-bleed background layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-br from-[#04325a] via-[#044c5a] to-[#058f6e] opacity-100"></div>
        {/* subtle diagonal overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#00182740_0%,#00182700_50%)]"></div>
      </div>

      {/* LEFT HERO (uses half+ of the screen on large) */}
      <section className="relative z-10 lg:col-span-7 flex items-center justify-center px-8 lg:px-20 py-24">
        <div className="max-w-xl text-center lg:text-left">
          <h1 className="text-[48px] lg:text-[64px] leading-tight font-extrabold text-white drop-shadow-lg">
            Learn Faster.
            <br />
            Learn Smarter.
          </h1>

          <p className="mt-6 text-lg lg:text-xl text-white/85 max-w-2xl">
            GenEd uses AI to personalize your learning path — adaptive lessons,
            meaningful feedback, and real progress tracking that adapts to you.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-[#6dffb5]">
                ✓
              </span>
              Personalized AI tutoring
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-[#6dffb5]">
                ✓
              </span>
              Real-time progress insights
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-[#6dffb5]">
                ✓
              </span>
              Built for modern learners
            </li>
          </ul>
        </div>
      </section>

      {/* RIGHT AUTH AREA */}
      <aside className="relative z-10 lg:col-span-5 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          {/* Centering box -> bigger card that visually uses vertical space */}
          <div className="relative rounded-2xl bg-[#071f36]/95 border border-white/6 shadow-2xl p-10 lg:p-12 overflow-hidden">
            {/* Soft large blurred accent behind the card (fills more of screen visually) */}
            <div className="absolute -left-20 -top-24 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-[#06314a] to-[#0b5d4b] opacity-20 filter blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-white text-2xl font-semibold">
                {" "}
                {isLogin ? "Welcome back" : "Create your account"}{" "}
              </h2>
              <p className="mt-2 text-sm text-[#9ddfc7]">
                {" "}
                {isLogin
                  ? "Sign in to continue your learning"
                  : "Create your GenEd account"}{" "}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="sr-only" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Username"
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#3ddc97]/40 transition"
              />

              {!isLogin && (
                <>
                  <label className="sr-only" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Email address"
                    className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#3ddc97]/40 transition"
                  />

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="sr-only" htmlFor="age">Age</label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        min="4"
                        max="18"
                        value={formData.age}
                        onChange={handleChange}
                        required
                        placeholder="Age (4-18)"
                        className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#3ddc97]/40 transition"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="sr-only" htmlFor="grade">Grade</label>
                      <input
                        id="grade"
                        name="grade"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.grade}
                        onChange={handleChange}
                        required
                        placeholder="Grade (1-12)"
                        className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#3ddc97]/40 transition"
                      />
                    </div>
                  </div>

                  <label className="sr-only" htmlFor="school_board">School Board</label>
                  <select
                    id="school_board"
                    name="school_board"
                    value={formData.school_board}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#3ddc97]/40 transition"
                  >
                    <option value="" disabled className="bg-[#071f36] text-gray-400">Select School Board</option>
                    <option value="CBSE" className="bg-[#071f36] text-white">CBSE</option>
                    <option value="ICSE" className="bg-[#071f36] text-white">ICSE</option>
                    <option value="State Board" className="bg-[#071f36] text-white">State Board</option>
                  </select>
                </>
              )}

              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#3ddc97]/40 transition"
              />

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative inline-flex items-center justify-center py-3 rounded-full font-semibold text-[#042E5C] bg-gradient-to-r from-[#05c07a] to-[#2ae3a0] shadow-accent transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading
                    ? "Processing..."
                    : isLogin
                      ? "Sign in"
                      : "Create account"}
                </button>
              </div>
            </form>

            {/* Status */}
            {status && (
              <p
                className={`mt-4 text-center text-sm ${status.toLowerCase().includes("success") ? "text-[#6dffb5]" : "text-[#ff8a8a]"}`}
              >
                {status}
              </p>
            )}

            {/* Toggle */}
            <div className="mt-6 text-center text-sm text-[#b0e8d2]">
              {isLogin ? "New here? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setStatus("");
                }}
                className="ml-1 inline-block bg-[#07121a]/60 px-4 py-1 rounded-full text-[#6dffb5] font-medium hover:bg-[#07121a]/80 transition"
              >
                {isLogin ? "Create an account" : "Sign in"}
              </button>
            </div>

            {/* subtle footer note (makes card feel integrated with full screen) */}
            <div className="mt-6 text-xs text-center text-white/30">
              <span>By continuing you agree to our Terms & Privacy</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
