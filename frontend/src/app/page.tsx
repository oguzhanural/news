'use client';

import { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  category: string;
  time: string;
  imageUrl: string;
}

export default function HomePage() {
  const { isDarkMode } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample news data
  const mainNews: NewsItem[] = [
    {
      id: 1,
      title: "Trump to be sentenced over hush money case but judge signals no jail time",
      description: "The US president-elect dismisses the case as \"nothing but a rigged charade\".",
      category: "US & Canada",
      time: "10 hrs ago",
      imageUrl: "/images/trump.jpg"
    },
    {
      id: 2,
      title: "China's overqualified youth taking jobs as drivers",
      description: "With high youth unemployment rates, Chinese graduates are resorting to working as waiters and cleaners.",
      category: "Asia",
      time: "16 hrs ago",
      imageUrl: "/images/china.jpg"
    },
    // Add more news items as needed
  ];

  const leftNews: NewsItem[] = [
    {
      id: 3,
      title: "Biden awards Wintour, Bono and Soros with Medal of Freedom",
      description: "Campaigners, politicians and athletes are among those receiving the US's highest civilian award.",
      category: "US & Canada",
      time: "1 hr ago",
      imageUrl: "/images/biden.jpg"
    }
  ];

  const rightNews: NewsItem[] = [
    {
      id: 4,
      title: "Prince William shocked by death of ex-nanny's stepson",
      description: "Edward Pettifer, whose step-mother Tiggy Legge-Bourke was Prince William and Harry's nanny, was among 14 killed.",
      category: "UK",
      time: "Just now",
      imageUrl: "/images/william.jpg"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mainNews.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mainNews.length) % mainNews.length);
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {leftNews.map((news) => (
            <div key={news.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-lg`}>
              <div className="relative h-48 mb-4">
                <Image
                  src={news.imageUrl}
                  alt={news.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{news.title}</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{news.description}</p>
                <div className="flex justify-between text-sm">
                  <span>{news.category}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Column - Swipeable News */}
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {mainNews.map((news) => (
                <div key={news.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-lg mb-8`}>
                  <div className="relative h-64 mb-4">
                    <Image
                      src={news.imageUrl}
                      alt={news.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{news.title}</h2>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{news.description}</p>
                    <div className="flex justify-between text-sm">
                      <span>{news.category}</span>
                      <span>{news.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-r"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-l"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {rightNews.map((news) => (
            <div key={news.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-lg`}>
              <div className="relative h-48 mb-4">
                <Image
                  src={news.imageUrl}
                  alt={news.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{news.title}</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{news.description}</p>
                <div className="flex justify-between text-sm">
                  <span>{news.category}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
