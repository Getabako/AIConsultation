import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI相談室 - AIについて何でも聞いてください",
  description: "AIに関するお悩みや質問に即座にお答えします。Google検索のように気軽にご相談ください。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
