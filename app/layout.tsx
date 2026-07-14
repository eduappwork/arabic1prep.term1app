import "@fontsource-variable/alexandria";
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialCard = `${origin}/social-card.png`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "رحلة العربية | الصف الأول الإعدادي",
      template: "%s | رحلة العربية",
    },
    description:
      "تطبيق تفاعلي لمنهج اللغة العربية للصف الأول الإعدادي، الفصل الدراسي الأول، مع الأستاذ محمد سعيد جعباص.",
    applicationName: "رحلة العربية",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "رحلة العربية",
      description: "تعلّم العربية، تدرّب، وافتح الدروس خطوة بخطوة.",
      locale: "ar_EG",
      type: "website",
      images: [{ url: socialCard, alt: "رحلة العربية للصف الأول الإعدادي" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "رحلة العربية",
      description: "تعلّم العربية، تدرّب، وافتح الدروس خطوة بخطوة.",
      images: [socialCard],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
