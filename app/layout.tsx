import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Temporarily use system fonts to fix Turbopack build issues
// TODO: Re-enable Google Fonts when Turbopack font loading is stable
const geistSans = {
  variable: "--font-geist-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "SuiVerify - Digital Identity Infrastructure",
  description: "One Identity Layer to Bridge Old and New Internets.",
  keywords: ["digital identity", "blockchain", "verification", "Aadhaar", "DID", "NFT", "Sui", "KYC", "government"],
  authors: [{ name: "SuiVerify" }],
  robots: "index, follow",
  themeColor: "#00BFFF",
  viewport: "width=device-width, initial-scale=1.0",
  icons: {
    icon: "/head_logo.png",
    apple: "/head_logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://suiverify.xyz/",
    title: "SuiVerify - Digital Identity Infrastructure",
    description: "One Identity Layer to Bridge Old and New Internets.",
    siteName: "SuiVerify",
    locale: "en_US",
    images: [
      {
        url: "https://suiverify.xyz/cover.png",
        width: 1200,
        height: 630,
        alt: "SuiVerify - Digital Identity Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@suiverify",
    creator: "@suiverify",
    title: "SuiVerify - Digital Identity Infrastructure",
    description: "One Identity Layer to Bridge Old and New Internets.",
    images: ["https://suiverify.xyz/head_logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SuiVerify",
  },
  other: {
    "msapplication-TileColor": "#00BFFF",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <WalletProvider>
            <ProtectedRoute>
              {children}
              <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </ProtectedRoute>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
