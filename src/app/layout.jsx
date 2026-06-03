import "../styles/styles.css";

const DESCRIPTION =
  "Menabung berhadiah tanpa pernah rugi modal. Dikelola agen AI non-custodial yang secara teknis tak bisa menyentuh modalmu.";

export const metadata = {
  applicationName: "Clova",
  title: {
    default: "Clova — no-loss prize-linked savings",
    template: "%s · Clova",
  },
  description: DESCRIPTION,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    type: "website",
    siteName: "Clova",
    title: "Clova — no-loss prize-linked savings",
    description: DESCRIPTION,
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Clova — no-loss prize-linked savings",
    description: DESCRIPTION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#F4F1E8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {/* React 19 hoists these to <head>. Fonts match the design system tokens. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Quicksand:wght@500;600;700&family=Playfair+Display:wght@500;600;700&family=Lora:wght@500;600;700&display=swap"
        />
        {children}
      </body>
    </html>
  );
}
