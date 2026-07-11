import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FixPro',
  description: 'Vos services à domicile, en un seul clic — FixPro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
