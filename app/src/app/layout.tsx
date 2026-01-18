import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "กล่องเอกสารดิจิทัล | Accounting Document Hub",
  description: "ระบบจัดการเอกสารบัญชีที่ทำให้ 'คนส่งเอกสาร' ส่งได้ถูกตั้งแต่ต้น และทำให้ 'บัญชี' บันทึกได้เร็วขึ้น",
  keywords: ["accounting", "document management", "expense tracking", "invoice", "receipt"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
