import type { Metadata } from 'next';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: '艾先生的内容社区',
  description: '基于 Next.js 与 Supabase 的全栈技术社区',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="bg-gray-50 min-h-screen text-gray-900 antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
