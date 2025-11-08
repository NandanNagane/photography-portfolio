import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { Toaster, toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => {
    // Check if session ID exists in localStorage
    let existingSessionId = localStorage.getItem("photography_chat_session_id");

    if (!existingSessionId) {
      // Generate new session ID: device fingerprint + timestamp
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const browserInfo = `${navigator.userAgent.slice(0, 20)}`.replace(
        /[^a-z0-9]/gi,
        ""
      );
      console.log(navigator);
      
      existingSessionId = `session_${browserInfo}_${timestamp}_${randomId}`;

      // Store in localStorage to persist across page reloads
      localStorage.setItem("photography_chat_session_id", existingSessionId);
    }

    return existingSessionId;
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setVoiceSupported(true);
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => prev.trim() ? `${prev} ${transcript}` : transcript);

        setIsListening(false);

        // Auto-send after voice input
        // setTimeout(() => sendMessage(transcript), 500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          toast.error(
            "Microphone access denied. Please enable microphone permissions in your browser settings."
          );
        } else if (event.error === "no-speech") {
          toast.info("No speech detected. Please try speaking again.");
        } else if (event.error === "audio-capture") {
          toast.error(
            "No microphone found. Please connect a microphone and try again."
          );
        } else if (event.error === "network") {
          toast.error(
            "Network error. Voice recognition requires an internet connection."
          );
        } else {
          toast.error(
            `Voice recognition error: ${event.error}. Please try typing instead.`
          );
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Welcome message
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome to our photography studio! I'm here to help you explore our portfolio, learn about our services, and discuss your photography needs. How can I assist you today?",
      },
    ]);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast.error(
        "Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.info("Speak now... Click microphone again to stop.");
      } catch (error) {
        console.error("Error starting recognition:", error);
        if (error.name === "InvalidStateError") {
          // Recognition is already started, try to restart
          recognitionRef.current?.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              toast.error(
                "Could not start voice recognition. Please refresh the page."
              );
            }
          }, 100);
        } else {
          toast.error(
            "Could not start voice recognition. Please check microphone permissions."
          );
        }
      }
    }
  };

  const speak = (text) => {
    if (!voiceEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: messageText,
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Only show toast when a lead was just created or updated
      if (
        response.data.lead_event === "created" ||
        response.data.lead_event === "updated"
      ) {
        const eventText =
          response.data.lead_event === "created"
            ? "Your information has been saved!"
            : "Your information has been updated!";

        toast.success(`${eventText} We'll contact you within 24 hours.`, {
          duration: 5000,
        });
      }

      // Speak the response if voice is enabled
      speak(response.data.response);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Optional: Clear session and start new conversation
  const startNewConversation = () => {
    localStorage.removeItem("photography_chat_session_id");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-neutral-50 via-stone-50 to-amber-50">
      <Toaster position="top-center" richColors />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-amber-100/20 to-stone-100/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center space-y-4">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Artistry in Every Frame
            </h1>
            <p
              className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Experience timeless photography that captures authentic moments
              and genuine emotion
            </p>
          </div>
        </div>
      </div>

      {/* Chatbot Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Voice Feature Notice */}
        {voiceSupported && (
          <div
            data-testid="voice-notice"
            className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="shrink-0 mt-0.5">
              <Mic className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3
                className="text-sm font-semibold text-amber-900 mb-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Voice Input Available
              </h3>
              <p
                className="text-xs text-amber-800"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Click the microphone button below to speak your question. You'll
                be prompted to allow microphone access the first time you use
                it.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-stone-200">
          {/* Chat Header */}
          <div className="bg-linear-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Chat with Us
              </h2>
              <p
                className="text-amber-100 text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Ask about our services, pricing, or book a session
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewConversation}
                className="text-white hover:bg-amber-800 text-xs"
                title="Start a new conversation"
              >
                New Chat
              </Button>
              <Button
                data-testid="voice-toggle-btn"
                variant="ghost"
                size="icon"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="text-white hover:bg-amber-800"
                title={
                  voiceEnabled ? "Disable voice output" : "Enable voice output"
                }
              >
                {voiceEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
              {isSpeaking && (
                <Button
                  data-testid="stop-speaking-btn"
                  variant="ghost"
                  size="sm"
                  onClick={stopSpeaking}
                  className="text-white hover:bg-amber-800"
                >
                  Stop
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            data-testid="chat-messages"
            className="h-96 overflow-y-auto p-6 space-y-4 bg-stone-50/50"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                data-testid={`message-${msg.role}-${idx}`}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-amber-600 text-white"
                      : "bg-white border border-stone-200 text-stone-800 shadow-sm"
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div
                className="flex justify-start"
                data-testid="loading-indicator"
              >
                <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-stone-200 p-4 bg-white">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  data-testid="message-input"
                  type="text"
                  placeholder={
                    isListening
                      ? "Listening..."
                      : "Type your message or use voice..."
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full rounded-xl border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                  disabled={isListening || isLoading}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <Button
                data-testid="voice-input-btn"
                variant="outline"
                size="icon"
                onClick={toggleVoiceRecognition}
                disabled={isLoading || !voiceSupported}
                className={`rounded-xl ${
                  isListening
                    ? "bg-red-100 border-red-300"
                    : "border-stone-300 hover:bg-amber-50"
                } ${!voiceSupported ? "opacity-40 cursor-not-allowed" : ""}`}
                title={
                  voiceSupported
                    ? "Click to start voice input"
                    : "Voice input not available in this browser"
                }
              >
                {isListening ? (
                  <MicOff className="h-5 w-5 text-red-600" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <Button
                data-testid="send-message-btn"
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {voiceSupported ? (
              <p
                className="text-xs text-stone-500 mt-2 text-center"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                🎤 Voice input available • Click microphone to speak • Allow
                microphone permissions when prompted
              </p>
            ) : (
              <p
                className="text-xs text-amber-600 mt-2 text-center"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Voice input not available. Please use Chrome, Edge, or Safari
                for voice features.
              </p>
            )}
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div
            data-testid="info-card-portfolio"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-stone-200 hover:shadow-lg transition-all"
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our Portfolio
            </h3>
            <p
              className="text-stone-600 text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Weddings, portraits, events, and family sessions captured with
              artistic excellence
            </p>
          </div>
          <div
            data-testid="info-card-packages"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-stone-200 hover:shadow-lg transition-all"
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Flexible Packages
            </h3>
            <p
              className="text-stone-600 text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              From intimate sessions to full-day coverage, packages starting at
              $599
            </p>
          </div>
          <div
            data-testid="info-card-booking"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-stone-200 hover:shadow-lg transition-all"
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Easy Booking
            </h3>
            <p
              className="text-stone-600 text-sm"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Chat with us to discuss your needs and schedule your session today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
