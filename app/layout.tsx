import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({ 
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'مساعد الذكاء الاصطناعي',
  description: 'تطبيق دردشة ذكاء اصطناعي مبني بواسطة Gemini',
};

export default function RootLayout({
  children,
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.variable} font-sans bg-bg-default text-text-default`}>
        {children}
      </body>
    </html>
  );
}
