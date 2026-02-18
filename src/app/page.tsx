"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setAsked(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        setAnswer("エラーが発生しました。しばらくしてからお試しください。");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullAnswer += chunk;
          setAnswer(fullAnswer);
        }
      }
    } catch {
      setAnswer("接続エラーが発生しました。ネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setAnswer("");
    setAsked(false);
  };

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: asked ? "flex-start" : "center",
      minHeight: "100vh",
      padding: "40px 20px",
      transition: "all 0.3s ease",
    }}>
      {/* Logo */}
      <div
        onClick={handleNewQuestion}
        style={{
          cursor: "pointer",
          fontSize: asked ? "28px" : "56px",
          fontWeight: 700,
          color: "#4285F4",
          marginBottom: asked ? "20px" : "40px",
          transition: "all 0.3s ease",
          userSelect: "none",
        }}
      >
        AI相談室
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} style={{
        width: "100%",
        maxWidth: "640px",
        marginBottom: "24px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #dfe1e5",
          borderRadius: "24px",
          padding: "10px 20px",
          boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
          transition: "box-shadow 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 1px 6px rgba(32,33,36,0.2)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 6px rgba(32,33,36,0.08)")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: "12px", flexShrink: 0 }}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#9aa0a6"/>
          </svg>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="AIについて何でも聞いてください"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "16px",
              fontFamily: "inherit",
              background: "transparent",
            }}
          />
          {question && (
            <button
              type="button"
              onClick={() => setQuestion("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "#70757a",
                padding: "0 8px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "20px" }}>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              padding: "10px 24px",
              fontSize: "14px",
              fontFamily: "inherit",
              backgroundColor: loading ? "#ccc" : "#4285F4",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            {loading ? "回答中..." : "AI に聞く"}
          </button>
        </div>
      </form>

      {/* Answer Area */}
      {asked && (
        <div
          ref={answerRef}
          style={{
            width: "100%",
            maxWidth: "720px",
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "24px 28px",
            marginTop: "8px",
            maxHeight: "60vh",
            overflowY: "auto",
            lineHeight: 1.8,
            fontSize: "15px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {answer ? (
            <div className="markdown-body">
              <ReactMarkdown>{answer}</ReactMarkdown>
              {!loading && (
                <div style={{
                  marginTop: "24px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e0e0e0",
                  fontSize: "14px",
                  color: "#5f6368",
                }}>
                  📝 もっと詳しく知りたい方は
                  <a
                    href="https://forms.gle/JQVBdZdrUWGysvhaA"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: "4px", fontWeight: 500 }}
                  >
                    こちらからご相談ください →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#9aa0a6" }}>
              <div className="loading-dots">考え中</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "12px",
        textAlign: "center",
        fontSize: "12px",
        color: "#70757a",
        background: "#f2f2f2",
        borderTop: "1px solid #e0e0e0",
      }}>
        © 2025 IF塾 | AI相談室
      </footer>
    </main>
  );
}
