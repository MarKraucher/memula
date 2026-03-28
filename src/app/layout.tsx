import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memula",
  description: "AI-powered personal note manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
