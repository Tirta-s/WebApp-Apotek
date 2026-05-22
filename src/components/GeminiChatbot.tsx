import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";

export function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "bot", text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: "bot", text: `Error: ${data.error}` }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "bot", text: "Maaf, terjadi kesalahan saat menghubungi asisten AI." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[#1a73e8] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#1557b0] transition-colors z-[100]"
        title="Tanya Gemini"
      >
        <span className="material-symbols-outlined text-[28px]">{isOpen ? "close" : "smart_toy"}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-4 md:right-8 w-80 md:w-96 bg-surface border border-outline-variant rounded-2xl shadow-xl flex flex-col z-[100] h-[450px] overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a73e8] text-white p-4 flex items-center gap-3">
            <span className="material-symbols-outlined">smart_toy</span>
            <div>
              <h3 className="font-bold font-headline-sm">Medisync AI</h3>
              <p className="text-xs opacity-80">Powered by Gemini</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-surface-muted flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center text-on-surface-variant text-sm mt-4">
                👋 Halo! Saya asisten virtual AI Anda. Ada yang bisa saya bantu hari ini?
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.role === "user" ? "bg-[#1a73e8] text-white rounded-br-none" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-none"}`}>
                  {msg.role === "bot" ? (
                    <div className="markdown-body prose prose-sm prose-p:my-1 text-on-surface">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-container-low text-on-surface border border-outline-variant rounded-xl rounded-bl-none p-3 text-sm flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-outline-variant bg-surface-container-lowest flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tanya sesuatu..."
              className="flex-1 h-10 px-4 rounded-full bg-surface-muted border border-outline-variant focus:outline-none focus:border-[#1a73e8] text-sm"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#1a73e8] disabled:opacity-50 text-white flex items-center justify-center hover:bg-[#1557b0] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
