import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "News App",
  description: "Your trusted source for news",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
