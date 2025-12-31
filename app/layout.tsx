import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google"

import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/providers/theme-provider";
import { UserProvider } from "@/providers/user-provider";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Parkito Host Dashboard",
  description: "Gestisci i tuoi parcheggi con Parkito",
};
const interTight = Inter_Tight(
  {
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-inter-tight"
  }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user server-side and pass to UserProvider
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interTight.className} antialiased`}
      >
        <Link
          href="#main-content"
          tabIndex={0}
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:outline-2 focus:outline-blue-500 focus:rounded"
        >
          Vai al contenuto
        </Link>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <UserProvider initialUser={user}>
            <main id="main-content">
              {children}
            </main>
            <Toaster richColors position="top-center" />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
