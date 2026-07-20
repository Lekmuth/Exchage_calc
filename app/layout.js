import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "cyrillic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata = {
  title: "АурумОбмін - Ювелірний Калькулятор",
  description: "Зручний професійний калькулятор обміну ювелірних виробів та розрахунку вартості брухту золота.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk" data-theme="dark" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
