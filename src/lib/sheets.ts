import { google } from "googleapis";

export async function appendToSheet(
  question: string,
  answer: string,
  email?: string
) {
  try {
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!privateKey || !clientEmail || !spreadsheetId || privateKey === "placeholder") {
      console.log("Google Sheets not configured, skipping log.");
      return;
    }

    const auth = new google.auth.JWT(clientEmail, undefined, privateKey, [
      "https://www.googleapis.com/auth/spreadsheets",
    ]);

    const sheets = google.sheets({ version: "v4", auth });

    const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "AI相談!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[now, question, answer, email || ""]],
      },
    });
  } catch (error) {
    console.error("Failed to log to Google Sheets:", error);
  }
}
