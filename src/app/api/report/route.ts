import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email, question, answer } = await req.json();

    if (!email || !question || !answer) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    // Generate full report via Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    let fullAnswer = answer;

    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `あなたは「AI相談室」のAIアドバイザーです。以下の質問に対して、詳しく実践的なフルバージョンの回答を作成してください。

回答の要件:
- 800〜1000文字程度で詳しく回答する
- 具体的なツール名、手順、活用事例を含める
- プロフェッショナルで信頼感のあるトーン（絵文字は使わない）
- 必ず見出しで区切って構造化する
- マークダウンは絶対に使わない。プレーンテキストで回答する
- 見出しは【】で囲む（例: 【おすすめの活用法】）
- 箇条書きは「・」を使う
- 最後に「さらに個別のご状況に合わせたアドバイスも可能です。お気軽にご相談ください。」のような形で締める

質問: ${question}

※以下は簡易回答です。これを大幅に拡充してください:
${answer}`
                }]
              }],
            }),
          }
        );
        const geminiData = await geminiRes.json();
        const generated = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) fullAnswer = generated;
      } catch (e) {
        console.error("Gemini error:", e);
      }
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || resendKey === "placeholder") {
      return NextResponse.json({ error: "メール送信サービスが未設定です" }, { status: 503 });
    }

    const resend = new Resend(resendKey);

    const htmlBody = formatAnswerToHtml(fullAnswer);

    await resend.emails.send({
      from: "AI相談室 <noreply@if-juku.net>",
      to: email,
      subject: "【AI相談室】ご相談の回答",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', 'Noto Sans JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #1a73e8, #4285F4); padding: 32px 24px; text-align: center;">
    <h1 style="color: #fff; font-size: 24px; margin: 0;">AI相談室</h1>
    <p style="color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 14px;">ご相談の詳細回答</p>
  </div>

  <div style="background: #fff; padding: 32px 24px;">
    <div style="background: #f0f4ff; border-left: 4px solid #4285F4; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
      <p style="font-size: 12px; color: #4285F4; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">ご質問</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0; color: #202124;">${escapeHtml(question)}</p>
    </div>

    <div style="font-size: 14px; line-height: 1.9; color: #333;">
      ${htmlBody}
    </div>

    <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e8e8e8; text-align: center;">
      <p style="font-size: 16px; font-weight: 700; color: #202124; margin-bottom: 8px;">あなたの状況に合わせた具体的なアドバイスが必要ですか？</p>
      <p style="font-size: 13px; color: #5f6368; margin-bottom: 20px;">AIの専門家が直接ご相談に乗ります（無料）</p>
      <a href="https://forms.gle/JQVBdZdrUWGysvhaA" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #1a73e8, #4285F4); color: #fff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px;">
        無料で専門家に相談する &rarr;
      </a>
    </div>
  </div>

  <div style="padding: 24px; text-align: center; font-size: 12px; color: #999;">
    <p>if(塾) | AI相談室</p>
    <p style="margin-top: 4px;">このメールはAI相談室からの自動送信です</p>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAnswerToHtml(text: string): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 【見出し】 format
    const headingMatch = trimmed.match(/^【(.+?)】$/);
    if (headingMatch) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3 style="font-size: 15px; font-weight: 700; color: #1a73e8; margin: 28px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e8f0fe;">${headingMatch[1]}</h3>`;
      continue;
    }

    // ## Markdown heading
    const mdHeadingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (mdHeadingMatch) {
      if (inList) { html += "</ul>"; inList = false; }
      const headingText = mdHeadingMatch[1].replace(/\*\*/g, "");
      html += `<h3 style="font-size: 15px; font-weight: 700; color: #1a73e8; margin: 28px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e8f0fe;">${headingText}</h3>`;
      continue;
    }

    // Bullet points (・, -, *)
    const bulletMatch = trimmed.match(/^[・\-\*]\s*(.+)$/);
    if (bulletMatch) {
      if (!inList) { html += `<ul style="margin: 8px 0; padding-left: 20px;">`; inList = true; }
      let content = bulletMatch[1];
      // Bold with ** or 「」
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #202124;">$1</strong>');
      html += `<li style="margin-bottom: 6px; line-height: 1.8;">${content}</li>`;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)[.．]\s*(.+)$/);
    if (numMatch) {
      if (inList) { html += "</ul>"; inList = false; }
      let content = numMatch[2];
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #202124;">$1</strong>');
      html += `<div style="margin-bottom: 8px; padding-left: 4px;"><strong style="color: #4285F4;">${numMatch[1]}.</strong> ${content}</div>`;
      continue;
    }

    // Empty line
    if (!trimmed) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<div style="height: 12px;"></div>`;
      continue;
    }

    // Normal paragraph
    if (inList) { html += "</ul>"; inList = false; }
    let content = trimmed;
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #202124;">$1</strong>');
    html += `<p style="margin: 0 0 8px 0; line-height: 1.9;">${content}</p>`;
  }

  if (inList) html += "</ul>";
  return html;
}
