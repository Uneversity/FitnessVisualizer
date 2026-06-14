import "./globals.css";
import Link from "next/link";



export const metadata = {
  title: "AI Fitness Tracker",
  description: "Track your workouts with pose detection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-arial bg-black text-white`}>

        <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
          <span className="text-green-400 font-bold text-xl">💪 FitTracker</span>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-400 hover:text-green-400 transition-colors">
              Home
            </Link>
            <Link href="/tracker" className="text-gray-400 hover:text-green-400 transition-colors">
              Tracker
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-green-400 transition-colors">
              Dashboard
            </Link>
          </div>
        </nav>

        {children}

      </body>
    </html>
  );
}