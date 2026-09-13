import "../styles/globals.css";

export const metadata = {
  title: "Vignan Foundation for Science, Technology & Research - Loan Verification",
  description: "Vignan Foundation for Science and Technology - Education Loan Support & AI Verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}