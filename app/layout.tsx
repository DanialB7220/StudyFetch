import { ReactNode } from 'react';
import Link from 'next/link'; // Import Next.js Link
import './globals.css'; // Global styles (e.g., Tailwind)
import FlashcardSidebar from './components/FlashcardSidebar'; // Import the FlashcardSidebar component

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-green-600 text-white p-6 rounded-xl shadow-lg">
            {/* Clickable Flashcard Sets heading */}
            <Link href="/" passHref>
              <h2 className="text-2xl font-semibold mb-6 cursor-pointer hover:underline">
                Flashcard Sets
              </h2>
            </Link>
            <div className="space-y-4">
              <FlashcardSidebar /> {/* Include the FlashcardSidebar component */}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8 bg-gray-50">
            <header className="mb-6 text-center">
              <h1 className="text-4xl font-bold text-black">AI Tutor</h1>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
};

export default Layout;
