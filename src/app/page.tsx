"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
    setEmailSent(false);
    setEmail("");

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

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || emailSending) return;

    setEmailSending(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, question, answer }),
      });
      if (res.ok) {
        setEmailSent(true);
      }
    } catch {
      // ignore
    } finally {
      setEmailSending(false);
    }
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setAnswer("");
    setAsked(false);
    setEmailSent(false);
    setEmail("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <main style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: asked ? "flex-start" : "center",
        flex: 1,
        padding: "40px 20px 120px",
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
          maxWidth: "900px",
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
              maxWidth: "900px",
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
              <div>
                <div style={{ whiteSpace: "pre-wrap" }}>{answer}</div>

                {/* Email input section */}
                {!loading && !emailSent && (
                  <div style={{
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid #e0e0e0",
                  }}>
                    <p style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#202124",
                      marginBottom: "12px",
                    }}>
                      続きをメールで受け取る
                    </p>
                    <p style={{
                      fontSize: "13px",
                      color: "#5f6368",
                      marginBottom: "12px",
                    }}>
                      メールアドレスを入力すると、より詳しい回答をお送りします。
                    </p>
                    <form onSubmit={handleEmailSubmit} style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                        style={{
                          flex: 1,
                          minWidth: "200px",
                          padding: "10px 14px",
                          fontSize: "14px",
                          border: "1px solid #dfe1e5",
                          borderRadius: "6px",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={emailSending}
                        style={{
                          padding: "10px 20px",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          backgroundColor: emailSending ? "#ccc" : "#4285F4",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: emailSending ? "not-allowed" : "pointer",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {emailSending ? "送信中..." : "送信する"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Email sent confirmation */}
                {emailSent && (
                  <div style={{
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid #e0e0e0",
                    textAlign: "center",
                  }}>
                    <p style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#34a853",
                    }}>
                      メールを送信しました！
                    </p>
                    <p style={{
                      fontSize: "13px",
                      color: "#5f6368",
                      marginTop: "4px",
                    }}>
                      詳しい回答をメールでお届けしました。ご確認ください。
                    </p>
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
      </main>

      {/* Banner CTA */}
      <div style={{
        background: "linear-gradient(135deg, #1a73e8 0%, #4285F4 50%, #669df6 100%)",
        padding: "48px 20px",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#fff",
          marginBottom: "8px",
        }}>
          もっと詳しく知りたい方は
        </p>
        <p style={{
          fontSize: "16px",
          color: "rgba(255,255,255,0.85)",
          marginBottom: "24px",
        }}>
          AIの専門家が直接ご相談に乗ります
        </p>
        <a
          href="https://forms.gle/JQVBdZdrUWGysvhaA"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "16px 40px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#1a73e8",
            backgroundColor: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          無料で相談する →
        </a>
      </div>

      {/* Footer */}
      <footer style={{
        padding: "12px",
        textAlign: "center",
        fontSize: "12px",
        color: "#70757a",
        background: "#f2f2f2",
        borderTop: "1px solid #e0e0e0",
      }}>
        © 2025 IF塾 | AI相談室
      </footer>
    </div>
  );
}
