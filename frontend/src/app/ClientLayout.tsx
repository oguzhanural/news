'use client';

import Link from "next/link";
import { useState } from "react";
import SideMenu from "./components/SideMenu";
import { useTheme } from './context/ThemeContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        {/* Top Navigation */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2"
              onClick={() => setIsMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              className="p-2"
              onClick={() => setIsMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Center Logo */}
          <div className="text-2xl font-bold">NEWS</div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <Link href="/register">
              <button className={`${isDarkMode ? 'bg-black hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded`}>
                Register
              </button>
            </Link>
            <Link href="/signin">
              <button className={`${isDarkMode ? 'bg-black hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded`}>
                Sign In
              </button>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Navigation */}
        <nav className={`${isDarkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-t`}>
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center space-x-6 overflow-x-auto py-2 text-sm">
              <li><Link href="/" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Home</Link></li>
              <li><Link href="/news" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>News</Link></li>
              <li><Link href="/sport" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Sport</Link></li>
              <li><Link href="/business" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Business</Link></li>
              <li><Link href="/innovation" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Innovation</Link></li>
              <li><Link href="/culture" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Culture</Link></li>
              <li><Link href="/arts" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Arts</Link></li>
              <li><Link href="/travel" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Travel</Link></li>
              <li><Link href="/earth" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Earth</Link></li>
              <li><Link href="/video" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Video</Link></li>
              <li><Link href="/live" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>Live</Link></li>
            </ul>
          </div>
        </nav>
      </header>
      <main className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>{children}</main>
    </>
  );
} 