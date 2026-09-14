import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Vignan University · Agent 43 Education Loan Support Portal",
  description: "VFSTR Institutional Portal - Official Documentation and Accounts Coordination System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#172554",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, minHeight: "100%", width: "100%" }}>
      <body style={{ margin: 0, padding: 0, minHeight: "100dvh", width: "100%", overflowX: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
