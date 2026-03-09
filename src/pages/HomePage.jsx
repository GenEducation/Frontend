import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VoiceStream from "../components/VoiceStream";
import ChatPage from "../components/ChatPage";
import LeftPanel from "../components/LeftPanel";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatKey, setChatKey] = useState(Date.now());
  const [history, setHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
      return;
    }

    const fetchHistory = async () => {
      try {
        const user = JSON.parse(storedUser);

        const res = await fetch("/get-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.username || user.user_id,
            session_id: activeSessionId || "",
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };

    fetchHistory();
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex bg-[#0b1220] text-white overflow-hidden">
      <LeftPanel
        activeTab={activeTab}
        activeSessionId={activeSessionId}
        onTabChange={setActiveTab}
        onNewChat={() => {
          setActiveTab("chat");
          setActiveSessionId(null); // reset session
        }}
        onSelectSession={(sessionId) => {
          setActiveTab("chat");
          setActiveSessionId(sessionId);
        }}
      />

      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <ChatPage
            key={activeSessionId || ""}
            sessionId={activeSessionId}
            onSessionCreated={(newSessionId) => {
              setActiveSessionId(newSessionId);
            }}
          />
        ) : (
          <VoiceStream />
        )}
      </main>
    </div>
  );
}
