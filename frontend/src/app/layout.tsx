export const metadata = {
  title: "Vignan University · Agent 43 Education Loan Support Portal",
  description: "VFSTR Institutional Portal - Official Documentation and Accounts Coordination System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, height: "100%", width: "100%" }}>
      <body style={{ margin: 0, padding: 0, height: "100%", width: "100%", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
