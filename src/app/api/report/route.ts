import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email, question, answer } = await req.json();

    if (!email || !question || !answer) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return NextResponse.json({ error: "メール送信サービスが未設定です" }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "AI相談室 <noreply@if-juku.net>",
      to: email,
      subject: `【AI相談室】ご相談の回答レポート`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Noto Sans JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #4285F4;">
    <h1 style="color: #4285F4; font-size: 24px; margin: 0;">AI相談室</h1>
    <p style="color: #666; margin-top: 8px;">ご相談の回答レポート</p>
  </div>

  <div style="margin-top: 24px;">
    <h2 style="font-size: 16px; color: #4285F4; border-left: 3px solid #4285F4; padding-left: 12px;">ご質問</h2>
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 8px 0 24px;">
      ${escapeHtml(question)}
    </div>

    <h2 style="font-size: 16px; color: #4285F4; border-left: 3px solid #4285F4; padding-left: 12px;">回答</h2>
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 8px 0 24px; line-height: 1.8;">
      ${escapeHtml(answer).replace(/\n/g, "<br>")}
    </div>
  </div>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px;">
    <p>より詳しいご相談は直接お問い合わせください</p>
    <p><a href="https://forms.gle/JQVBdZdrUWGysvhaA" style="color: #4285F4;">相談フォームはこちら →</a></p>
    <p style="margin-top: 16px; font-size: 11px; color: #999;">© 2025 IF塾 | AI相談室</p>
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
