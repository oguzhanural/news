'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import SideMenu from "./components/SideMenu";
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useRouter } from 'next/navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add click outside listener
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    // Add event listener when dropdown is open
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    showToast('Successfully logged out', 'success');
    router.push('/');
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        {/* Top Navigation */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Center Logo */}
          <Link href="/" className="text-2xl font-bold hover:opacity-80">NEWS</Link>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                    <span className="text-lg">{user.name[0].toUpperCase()}</span>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-900' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                    <div className="py-1" role="menu">
                      <div className="px-4 py-2 text-sm border-b border-gray-700">
                        <p className="font-medium">{user.name}</p>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.role.toLowerCase()}</p>
                      </div>
                      <Link
                        href="/profile"
                        className={`block px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={toggleTheme}
                        className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                      >
                        {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm text-red-500 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/register">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Register
                  </button>
                </Link>
                <Link href="/signin">
                  <button className={`px-4 py-2 rounded-md ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                    Sign In
                  </button>
                </Link>
              </>
            )}
            {!user && (
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
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
            )}
          </div>
        </div>

        {/* Secondary Navigation */}
        <nav className={`${isDarkMode ? 'bg-black border-gray-700' : 'bg-white border-gray-200'} border-t`}>
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center space-x-6 overflow-x-auto py-2 text-sm">
              <li>
                <Link href="/" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/category/news" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  News
                </Link>
              </li>
              <li>
                <Link href="/category/sport" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Sport
                </Link>
              </li>
              <li>
                <Link href="/category/business" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Business
                </Link>
              </li>
              <li>
                <Link href="/category/technology" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Technology
                </Link>
              </li>
              <li>
                <Link href="/category/entertainment" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Entertainment
                </Link>
              </li>
              <li>
                <Link href="/category/health" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Health
                </Link>
              </li>
              <li>
                <Link href="/category/science" className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}>
                  Science
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
} 