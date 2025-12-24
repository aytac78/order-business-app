import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar, Header } from '@/components';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ORDER Business - Restaurant Management',
  description: 'Professional restaurant management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <Header />
          <main className="ml-64 pt-16 p-6 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
