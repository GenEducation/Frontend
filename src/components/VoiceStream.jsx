import { useState, useRef, useEffect, useCallback } from "react";

/* 🔒 Toggle this to false when voice is ready */
const COMING_SOON = false;

const VoiceStream = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Click to start");
  const [debugInfo, setDebugInfo] = useState("");

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  const log = useCallback((msg) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${msg}`);
  }, []);

  const cleanupResources = useCallback(() => {
    log("Cleaning up resources...");

    if (socketRef.current) {
      const sock = socketRef.current;
      sock.onopen = null;
      sock.onmessage = null;
      sock.onclose = null;
      sock.onerror = null;

      if (
        sock.readyState === WebSocket.OPEN ||
        sock.readyState === WebSocket.CONNECTING
      ) {
        sock.close();
      }
      socketRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    log("Cleanup complete");
  }, [log]);

  useEffect(() => {
    return () => cleanupResources();
  }, [cleanupResources]);

  const startRecording = async () => {
    if (COMING_SOON) return;

    if (
      socketRef.current &&
      socketRef.current.readyState !== WebSocket.CLOSED
    ) {
      log("Socket already active, ignoring start request");
      return;
    }

    try {
      setStatus("Requesting microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext({
        sampleRate: 16000,
        latencyHint: "interactive",
      });

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      audioContextRef.current = audioContext;
      nextStartTimeRef.current = audioContext.currentTime;

      setDebugInfo(`Sample Rate: ${audioContext.sampleRate}Hz`);
      setStatus("Connecting to server...");

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");

      const wsUrl = `${protocol}//${window.location.host}/ws/native_audio?user_id=${user.username}`;

      const socket = new WebSocket(wsUrl);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("Streaming...");
        setIsRecording(true);

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        const processor = audioContext.createScriptProcessor(512, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (
            !socketRef.current ||
            socketRef.current.readyState !== WebSocket.OPEN
          )
            return;

          const inputData = e.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(inputData.length);

          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          socketRef.current.send(buffer.buffer);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      socket.onmessage = (event) => {
        if (typeof event.data === "string") {

          const msg = JSON.parse(event.data);

          if (msg.type === "transcript") {
            console.log("Transcript:", msg.text);
          }

          if (msg.type === "ai_response") {
            console.log("AI:", msg.text);
          }

        } else {
          playAudioChunk(event.data);
        }
      };

      socket.onclose = () => {
        cleanupResources();
        setIsRecording(false);
        setStatus("Disconnected");
      };

      socket.onerror = () => {
        setStatus("Connection Error");
      };
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      cleanupResources();
    }
  };

  const handleToggle = () => {
    if (COMING_SOON) return;

    if (isRecording) {
      cleanupResources();
      setIsRecording(false);
      setStatus("Click to start");
    } else {
      startRecording();
    }
  };

  const playAudioChunk = (arrayBuffer) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const int16Data = new Int16Array(arrayBuffer);
    const float32Data = new Float32Array(int16Data.length);

    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = audioContext.createBuffer(
      1,
      float32Data.length,
      24000
    );
    buffer.getChannelData(0).set(float32Data);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const currentTime = audioContext.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  return (
    <div className="relative h-full w-full">
      {/* Blurred content */}
      <div
        className={`h-full w-full flex items-center justify-center transition
          ${COMING_SOON ? "blur-md pointer-events-none select-none" : ""}`}
      >
        <div className="voice-stream-container">
          <h1>Voice Stream</h1>
          <div className="card">
            <button
              onClick={handleToggle}
              style={{
                backgroundColor: isRecording ? "#d32f2f" : "#1a1a1a",
                color: "white",
                fontSize: "1.2rem",
                padding: "1rem 2rem",
                borderRadius: "50px",
                cursor: "pointer",
              }}
            >
              {isRecording ? "🛑 Stop Streaming" : "🎤 Start Streaming"}
            </button>

            <p style={{ marginTop: "1rem", color: "#888", fontWeight: "bold" }}>
              {status}
            </p>

            {debugInfo && (
              <p style={{ fontSize: "0.8rem", color: "#666" }}>
                {debugInfo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      {COMING_SOON && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="px-10 py-8 rounded-2xl text-center
                       bg-black/70 backdrop-blur-xl
                       border border-white/10 shadow-2xl"
          >
            <div className="text-3xl font-extrabold text-white mb-2">
              🎤 Voice Mode
            </div>
            <div className="text-lg text-white/80">Coming Soon</div>
            <div className="mt-2 text-sm text-white/50">
              We’re polishing the experience ✨
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceStream;
