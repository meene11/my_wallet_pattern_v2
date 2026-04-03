import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "MyWallet v2 | 감정 소비 분석",
  description: "지출 + 감정 데이터로 소비 습관을 진단합니다",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <SessionProviderWrapper>
          <AuthProvider>
            <div className="max-w-3xl mx-auto px-4 py-8">{children}</div>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
