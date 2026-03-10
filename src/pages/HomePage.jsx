import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VoiceStream from "../components/VoiceStream";
import ChatPage from "../components/ChatPage";
import LeftPanel from "../components/LeftPanel";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatKey, setChatKey] = useState(Date.now());
  const [activeSessionId, setActiveSessionId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
    }
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
