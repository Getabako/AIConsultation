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
- 段落分けして読みやすくする
- 最後に「さらに個別のご状況に合わせたアドバイスも可能です」のような形で締める

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

    await resend.emails.send({
      from: "AI相談室 <onboarding@resend.dev>",
      to: email,
      subject: "【AI相談室】ご相談の回答",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Noto Sans JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333; background: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #1a73e8, #4285F4); padding: 32px 24px; text-align: center;">
    <h1 style="color: #fff; font-size: 24px; margin: 0;">AI相談室</h1>
    <p style="color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 14px;">ご相談の回答</p>
  </div>

  <div style="background: #fff; padding: 32px 24px;">
    <h2 style="font-size: 15px; color: #4285F4; border-left: 3px solid #4285F4; padding-left: 12px; margin-bottom: 12px;">ご質問</h2>
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 28px; font-size: 14px; line-height: 1.6;">
      ${escapeHtml(question)}
    </div>

    <h2 style="font-size: 15px; color: #4285F4; border-left: 3px solid #4285F4; padding-left: 12px; margin-bottom: 12px;">詳しい回答</h2>
    <div style="padding: 0 4px; font-size: 14px; line-height: 1.9;">
      ${escapeHtml(fullAnswer).replace(/\n/g, "<br>")}
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <p style="font-size: 16px; font-weight: 700; color: #202124; margin-bottom: 8px;">さらに詳しく相談しませんか？</p>
      <p style="font-size: 13px; color: #5f6368; margin-bottom: 20px;">AIの専門家が直接ご相談に乗ります</p>
      <a href="https://forms.gle/JQVBdZdrUWGysvhaA" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #1a73e8, #4285F4); color: #fff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px;">
        さらに詳しく相談する →
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
