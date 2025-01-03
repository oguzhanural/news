'use client';

import Link from "next/link";
import { useState } from "react";
import SideMenu from "./components/SideMenu";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <header className="sticky top-0 z-40 bg-black text-white">
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
              <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Register
              </button>
            </Link>
            <Link href="/signin">
              <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        {/* Secondary Navigation */}
        <nav className="bg-black border-t border-gray-700">
          <div className="container mx-auto px-4">
            <ul className="flex items-center space-x-6 overflow-x-auto py-2 text-sm">
              <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
              <li><Link href="/news" className="hover:text-gray-300">News</Link></li>
              <li><Link href="/sport" className="hover:text-gray-300">Sport</Link></li>
              <li><Link href="/business" className="hover:text-gray-300">Business</Link></li>
              <li><Link href="/innovation" className="hover:text-gray-300">Innovation</Link></li>
              <li><Link href="/culture" className="hover:text-gray-300">Culture</Link></li>
              <li><Link href="/arts" className="hover:text-gray-300">Arts</Link></li>
              <li><Link href="/travel" className="hover:text-gray-300">Travel</Link></li>
              <li><Link href="/earth" className="hover:text-gray-300">Earth</Link></li>
              <li><Link href="/video" className="hover:text-gray-300">Video</Link></li>
              <li><Link href="/live" className="hover:text-gray-300">Live</Link></li>
            </ul>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
} 