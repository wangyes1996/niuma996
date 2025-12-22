import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import MaterialUIProvider from './MaterialUIProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "数字资产管理系统 - 加密货币交易平台",
    template: "%s - 数字资产管理系统"
  },
  description: "专业的加密货币资产管理系统，提供实时行情分析、AI智能交易建议和多账户管理功能",
  keywords: ["加密货币", "数字资产", "区块链", "AI交易", "资产管理"],
  authors: [{ name: "niuma996" }],
  creator: "niuma996",
  publisher: "niuma996",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://niuma996.com",
    title: "数字资产管理系统",
    description: "专业的加密货币资产管理系统",
    siteName: "数字资产管理系统",
    images: [
      {
        url: "https://niuma996.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "数字资产管理系统"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "数字资产管理系统",
    description: "专业的加密货币资产管理系统",
    images: ["https://niuma996.com/og-image.png"],
    creator: "@niuma996"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MaterialUIProvider>
          {children}
        </MaterialUIProvider>
      </body>
    </html>
  );
}
