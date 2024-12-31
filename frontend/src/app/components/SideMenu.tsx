'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
    { title: 'News', path: '/news', hasChildren: true },
    { title: 'Sport', path: '/sport', hasChildren: false },
    { title: 'Business', path: '/business', hasChildren: true },
    { title: 'Innovation', path: '/innovation', hasChildren: true },
    { title: 'Culture', path: '/culture', hasChildren: true },
    { title: 'Arts', path: '/arts', hasChildren: true },
    { title: 'Travel', path: '/travel', hasChildren: true },
    { title: 'Earth', path: '/earth', hasChildren: true },
    { title: 'Video', path: '/video', hasChildren: false },
    { title: 'Live', path: '/live', hasChildren: true },
    { title: 'Audio', path: '/audio', hasChildren: false },
    { title: 'Weather', path: '/weather', hasChildren: false },
    { title: 'Newsletters', path: '/newsletters', hasChildren: false },
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
      <div className={`fixed top-[104px] left-0 h-[calc(100%-104px)] w-[300px] bg-white text-black transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Search bar */}
        <div className="p-4 pt-16 border-b">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, topics and more"
              className="w-full p-2 pr-10 border rounded-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:text-blue-500"
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
            <div key={item.title} className="border-b">
              <div className="flex items-center justify-between p-4">
                <Link 
                  href={item.path}
                  className="text-lg font-semibold flex-grow text-black hover:text-gray-700"
                  onClick={onClose}
                >
                  {item.title}
                </Link>
                {item.hasChildren && (
                  <button 
                    onClick={() => toggleItem(item.title)}
                    className="p-2"
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
              {/* Dropdown content can be added here */}
              {expandedItems.includes(item.title) && (
                <div className="bg-gray-50 px-6 py-2">
                  {/* Add dropdown content here */}
                  <p className="text-gray-500">Subcategories coming soon...</p>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
} 