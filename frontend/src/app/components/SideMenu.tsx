'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: () => void;
}

export default function SideMenu({ isOpen, onClose, onSearch }: SideMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && onSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, onSearch]);

  // Don't render anything until mounted on client
  if (!mounted) {
    return null;
  }

  const toggleItem = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log('Searching for:', searchQuery);
  };

  const menuItems = [
    { title: 'Home', path: '/', hasChildren: false },
    { title: 'News', path: '/category/news', hasChildren: true },
    { title: 'Sport', path: '/category/sport', hasChildren: true },
    { title: 'Business', path: '/category/business', hasChildren: true },
    { title: 'Technology', path: '/category/technology', hasChildren: true },
    { title: 'Entertainment', path: '/category/entertainment', hasChildren: true },
    { title: 'Health', path: '/category/health', hasChildren: true },
    { title: 'Science', path: '/category/science', hasChildren: true }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-[104px] bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Menu */}
      <div className={`fixed top-[104px] left-0 h-[calc(100%-104px)] w-[300px] transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:opacity-75"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Search bar */}
        <div className={`p-4 pt-16 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, topics and more"
              className={`w-full p-2 pr-10 rounded-none focus:outline-none ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600 focus:ring-gray-600' 
                  : 'bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-blue-500'
              } border`}
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:opacity-75"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Navigation items */}
        <nav className="overflow-y-auto h-[calc(100%-120px)]">
          {menuItems.map((item) => (
            <div key={item.title} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between p-4">
                <Link 
                  href={item.path}
                  className={`text-lg font-semibold flex-grow hover:opacity-75 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}
                  onClick={onClose}
                >
                  {item.title}
                </Link>
                {item.hasChildren && (
                  <button 
                    onClick={() => toggleItem(item.title)}
                    className="p-2 hover:opacity-75"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transform transition-transform ${
                        expandedItems.includes(item.title) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Dropdown content */}
              {expandedItems.includes(item.title) && (
                <div className={`px-6 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Subcategories coming soon...
                  </p>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
} 