import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata = {
  title: 'Bhasha-Daksh | AI Skilling Platform',
  description: 'AI-Driven Regional-to-Global Skilling & Evaluation Ecosystem',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
