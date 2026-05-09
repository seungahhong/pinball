import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pinball Roulette',
  description: '핀볼-사다리 마블 룰렛 게임',
  openGraph: {
    title: 'Pinball Roulette',
    description: '핀볼-사다리 마블 룰렛 게임',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#1A1A2E] text-white">{children}</body>
    </html>
  );
}
