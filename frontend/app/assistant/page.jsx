"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import BottomNav from "../../components/layout/BottomNav";
import { useLanguage } from "../../context/LanguageContext";
import { useFarm } from "../../context/FarmContext";
import { sendChatMessage } from "../../lib/api";

export default function AssistantPage() {
  const { language, setLanguage } = useLanguage();
  const { farmData } = useFarm();

  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "assistant",
      text: `Namaste! I am your FasalAI Field Advisor. I have context on your ${farmData.acreage} Acre farm in ${farmData.district} with standing ${farmData.currentCrop} at Day 22. What would you like to know about watering, sprays, or market prices today?`,
      time: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported on this browser. Please type your message.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language === "Hindi" ? "hi-IN" : language === "Marathi" ? "mr-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      time: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await sendChatMessage(text, language, {
        crop: farmData.currentCrop,
        acreage: farmData.acreage,
        district: farmData.district,
        soilType: farmData.soilType,
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: res.reply,
        time: "Now",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Should I spray pesticide today?",
    "When is the next watering needed?",
    `Best mandi price for my ${farmData.currentCrop.toLowerCase()}?`,
    "How to treat yellow spots on leaves?",
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row antialiased">
      <Sidebar />
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto p-4 md:p-6 gap-3 pb-24 md:pb-12 h-[calc(100vh-64px)] md:h-screen">
        {/* Header */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-subtle flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-900 text-white flex items-center justify-center font-bold text-sm">
              👨‍🌾
            </div>
            <div>
              <h2 className="font-display font-bold text-content text-sm">Farm Advisor</h2>
              <p className="text-[11px] text-content-muted">Answers in simple Hindi, Marathi, or English</p>
            </div>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-stone-100 text-brand-900 font-semibold text-xs rounded-lg px-3 py-1.5 border border-stone-200 outline-none cursor-pointer"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3 py-2">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    🌱
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isUser
                      ? "bg-brand-900 text-white font-normal rounded-tr-xs"
                      : "bg-white text-content rounded-tl-xs border border-stone-200/80 shadow-subtle"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-content-muted self-start bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-subtle">
              <div className="w-2 h-2 rounded-full bg-brand-800 animate-pulse"></div>
              Checking farm conditions and formulating advice...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="flex gap-1.5 overflow-x-auto py-1 flex-shrink-0 no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-stone-50 text-content-muted hover:text-content rounded-full text-xs border border-stone-200 shadow-subtle transition-colors flex-shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-white p-2 rounded-full border border-stone-300 shadow-subtle flex-shrink-0"
        >
          <button
            type="button"
            onClick={startVoiceInput}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "bg-stone-100 text-brand-900 hover:bg-stone-200"
            }`}
            title="Speak your question"
          >
            <span className="material-symbols-outlined text-lg">
              {isListening ? "mic_off" : "mic"}
            </span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... please speak" : "Ask about your farm in your language..."}
            className="flex-grow bg-transparent text-content text-xs md:text-sm px-2 focus:outline-none placeholder:text-stone-400"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-9 h-9 rounded-full bg-brand-900 text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-950 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">arrow_upward</span>
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
