"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AIConsultationInner() {
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";
  return <Home embed={isEmbed} />;
}

export default function Page() {
  return (
    <Suspense>
      <AIConsultationInner />
    </Suspense>
  );
}

const LOADING_TEXTS = [
  "AIが考えています...",
  "分析中...",
  "回答を準備中...",
  "もう少しお待ちください...",
];

function LoadingAnimation() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-dots-container">
      <div className="loading-dots-row">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
      <div className="loading-text">{LOADING_TEXTS[textIndex]}</div>
    </div>
  );
}

function Home({ embed = false }: { embed?: boolean }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embed) {
      document.body.classList.add("embed-dark");
    }
    return () => { document.body.classList.remove("embed-dark"); };
  }, [embed]);

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: embed ? "auto" : "100vh", background: embed ? "transparent" : undefined }}>
      <main style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: asked ? "flex-start" : "center",
        flex: 1,
        padding: asked ? "20px 20px 20px" : "40px 20px 120px",
        transition: "all 0.3s ease",
      }}>
        {/* Title */}
        <div
          onClick={handleNewQuestion}
          className="gradient-title"
          style={{
            cursor: "pointer",
            fontSize: asked ? "28px" : "56px",
            fontWeight: 700,
            marginBottom: asked ? "8px" : "12px",
            transition: "font-size 0.3s ease, margin 0.3s ease",
            userSelect: "none",
          }}
        >
          AI相談室
        </div>

        {/* Subtitle */}
        {!asked && (
          <div className="subtitle" style={{ marginBottom: "36px" }}>
            AIについて何でも聞いてください
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSubmit} style={{
          width: "100%",
          maxWidth: "900px",
          marginBottom: "24px",
        }}>
          <div
            className="search-bar"
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #dfe1e5",
              borderRadius: "24px",
              padding: "12px 20px",
              boxShadow: "0 1px 6px rgba(32,33,36,0.08)",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
            }}
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
              className="btn-primary"
              style={{
                padding: "12px 28px",
                fontSize: "15px",
                fontFamily: "inherit",
                background: loading ? "#ccc" : "linear-gradient(135deg, #4285F4, #7c3aed)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
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
            className="answer-card"
            style={{
              width: "100%",
              maxWidth: "900px",
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(12px)",
              borderRadius: "12px",
              padding: "24px 28px",
              marginTop: "8px",
              lineHeight: 1.8,
              fontSize: "15px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            {answer ? (
              <div>
                <div style={{ whiteSpace: "pre-wrap" }}>{answer}</div>

                {/* Email input section */}
                {!loading && !emailSent && (
                  <div className="email-cta-section" style={{
                    marginTop: "28px",
                    padding: "24px",
                    background: "linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)",
                    borderRadius: "12px",
                    border: "1px solid rgba(66, 133, 244, 0.15)",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    <div className="email-cta-glow" />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div className="email-icon-pulse" style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #4285F4, #7c3aed)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          color: "#fff",
                          flexShrink: 0,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
                          </svg>
                        </div>
                        <p style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#202124",
                          margin: 0,
                        }}>
                          続きをメールで無料でお届けします
                        </p>
                      </div>
                      <p style={{
                        fontSize: "13px",
                        color: "#5f6368",
                        marginBottom: "16px",
                        lineHeight: 1.7,
                        paddingLeft: "46px",
                      }}>
                        AIによる詳細な回答は生成コストがかかるため、このページでは要約のみ表示しています。メールアドレスをご入力いただくと、具体的な手順・ツール名・事例を含む<strong style={{ color: "#4285F4" }}>フル回答</strong>を無料でお送りします。
                      </p>
                      <form onSubmit={handleEmailSubmit} style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        paddingLeft: "46px",
                      }}>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="メールアドレスを入力"
                          required
                          className="email-input"
                          style={{
                            flex: 1,
                            minWidth: "200px",
                            padding: "13px 16px",
                            fontSize: "14px",
                            border: "2px solid #d4d8ff",
                            borderRadius: "10px",
                            outline: "none",
                            fontFamily: "inherit",
                            background: "#fff",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={emailSending}
                          className="btn-email-send"
                          style={{
                            padding: "13px 28px",
                            fontSize: "14px",
                            fontFamily: "inherit",
                            background: emailSending ? "#ccc" : "linear-gradient(135deg, #4285F4, #7c3aed)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            cursor: emailSending ? "not-allowed" : "pointer",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {emailSending ? "送信中..." : "無料で受け取る"}
                        </button>
                      </form>
                      <p style={{
                        fontSize: "11px",
                        color: "#9aa0a6",
                        marginTop: "10px",
                        paddingLeft: "46px",
                      }}>
                        ※ 営業メール等は一切お送りしません
                      </p>
                    </div>
                  </div>
                )}

                {/* Email sent confirmation */}
                {emailSent && (
                  <div className="email-sent-section" style={{
                    marginTop: "28px",
                    padding: "24px",
                    background: "linear-gradient(135deg, #f0faf4 0%, #e8f5e9 100%)",
                    borderRadius: "12px",
                    border: "1px solid rgba(52, 168, 83, 0.2)",
                    textAlign: "center",
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #34a853, #2e7d32)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      fontSize: "22px",
                      color: "#fff",
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                      </svg>
                    </div>
                    <p style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#2e7d32",
                    }}>
                      メールを送信しました
                    </p>
                    <p style={{
                      fontSize: "13px",
                      color: "#5f6368",
                      marginTop: "6px",
                      lineHeight: 1.6,
                    }}>
                      詳しい回答をメールでお届けしました。<br />受信トレイをご確認ください。
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <LoadingAnimation />
            )}
          </div>
        )}
      </main>

      {/* Banner CTA */}
      {!embed && (
        <div className="banner-bg" style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}>
          <p style={{
            fontSize: "15px",
            color: "#fff",
            margin: 0,
          }}>
            <span style={{ fontWeight: 700 }}>もっと詳しく知りたい方は</span>
            <span style={{ opacity: 0.85, marginLeft: "8px" }}>- AIの専門家が直接ご相談に乗ります</span>
          </p>
          <a
            href="https://forms.gle/JQVBdZdrUWGysvhaA"
            target="_blank"
            rel="noopener noreferrer"
            className="banner-cta"
            style={{
              display: "inline-block",
              padding: "10px 28px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#4285F4",
              backgroundColor: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              whiteSpace: "nowrap",
            }}
          >
            無料で相談する →
          </a>
        </div>
      )}

      {/* Footer */}
      {!embed && (
        <footer style={{
          padding: "14px",
          textAlign: "center",
          fontSize: "12px",
          color: "#70757a",
          background: "rgba(242,242,242,0.8)",
          borderTop: "1px solid #e0e0e0",
        }}>
          © 2025 IF塾 | AI相談室
        </footer>
      )}
    </div>
  );
}
