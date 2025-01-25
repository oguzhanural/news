'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTheme } from '../app/context/ThemeContext';
import { useAuth } from '../app/context/AuthContext';
import { useRouter } from 'next/navigation';
import SideMenu from "../app/components/SideMenu";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md transition-colors duration-200">
      {/* Top Bar */}
      <div className="container mx-auto px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="text-3xl font-bold tracking-tighter hover:opacity-90 transition-opacity duration-200">NEWS</Link>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
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
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-blue-500 transition-colors duration-200">
                  <span className="text-lg font-semibold">{user.name[0].toUpperCase()}</span>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 transition-colors duration-200">
                  <div className="py-1" role="menu">
                    <div className="px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{user.role.toLowerCase()}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/signin"
                className="text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Categories Bar */}
      <nav className="w-full bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
        <div className="container mx-auto px-4">
          <ul className="flex items-center space-x-6 overflow-x-auto py-3 text-sm font-medium">
            <li><Link href="/" className="hover:text-blue-500 transition-colors duration-200">Home</Link></li>
            <li><Link href="/category/news" className="hover:text-blue-500 transition-colors duration-200">News</Link></li>
            <li><Link href="/category/sport" className="hover:text-blue-500 transition-colors duration-200">Sport</Link></li>
            <li><Link href="/category/business" className="hover:text-blue-500 transition-colors duration-200">Business</Link></li>
            <li><Link href="/category/technology" className="hover:text-blue-500 transition-colors duration-200">Technology</Link></li>
            <li><Link href="/category/entertainment" className="hover:text-blue-500 transition-colors duration-200">Entertainment</Link></li>
            <li><Link href="/category/health" className="hover:text-blue-500 transition-colors duration-200">Health</Link></li>
            <li><Link href="/category/science" className="hover:text-blue-500 transition-colors duration-200">Science</Link></li>
          </ul>
        </div>
      </nav>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
} 