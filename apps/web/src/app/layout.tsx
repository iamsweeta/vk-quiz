import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { PwaRegister } from '@/components/pwa/PwaRegister';

export const metadata: Metadata = {
  title: 'VK Quiz',
  description: 'VK Quiz — realtime quiz platform with catalog, email verification and live rooms',
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
  manifest: '/manifest.webmanifest',
  themeColor: '#ec4899',
  appleWebApp: { capable: true, title: 'VK Quiz', statusBarStyle: 'default' }
};

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('quizpulse-theme') || 'dark';
    if (theme !== 'light' && theme !== 'dark' && theme !== 'pink') theme = 'dark';
    document.documentElement.classList.remove('light', 'dark', 'pink');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
