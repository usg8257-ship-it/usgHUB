// app/layout.tsx
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title:       'USG - Centralized HUB',
  description: 'United Security Group — HR Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
