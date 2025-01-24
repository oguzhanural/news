'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  category: string;
  time: string;
  imageUrl?: string; // Made optional for right column
}

export default function Home() {
  const { isDarkMode } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample news data for left column
  const leftNews: NewsItem[] = [
    {
      id: 1,
      title: "Biden awards Wintour, Bono and Soros with Medal of Freedom",
      description: "Campaigners, politicians and athletes are among those receiving the US's highest civilian award.",
      category: "US & Canada",
      time: "1 hr ago",
      imageUrl: "https://ichef.bbci.co.uk/news/1536/cpsprodpb/9a6d/live/4ef48cc0-cad1-11ef-94cb-5f844ceb9e30.jpg.webp"
    },
    {
      id: 2,
      title: "Venus and crescent Moon stun stargazers",
      description: "The planet appeared shining brightly above a crescent Moon on Friday, creating a spectacular view for observers.",
      category: "Science & Environment",
      time: "4 hrs ago",
      imageUrl: "https://ichef.bbci.co.uk/news/1536/cpsprodpb/067e/live/83aab620-ca67-11ef-8e0d-273f188c66a4.jpg.webp"
    }
  ];

  // Sample news data for middle column carousel
  const middleNews: NewsItem[] = [
    {
      id: 3,
      title: "Trump to be sentenced over hush money case but judge signals no jail time",
      description: "The US president-elect dismisses the case as \"nothing but a rigged charade\".",
      category: "US & Canada",
      time: "10 hrs ago",
      imageUrl: "https://ichef.bbci.co.uk/news/1536/cpsprodpb/067e/live/83aab620-ca67-11ef-8e0d-273f188c66a4.jpg.webp"
    },
    {
      id: 4,
      title: "China's overqualified youth taking jobs as drivers",
      description: "With high youth unemployment rates, Chinese graduates are resorting to working as waiters and cleaners.",
      category: "Asia",
      time: "16 hrs ago",
      imageUrl: "https://ichef.bbci.co.uk/news/1536/cpsprodpb/9a6d/live/4ef48cc0-cad1-11ef-94cb-5f844ceb9e30.jpg.webp"
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % middleNews.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [middleNews.length]);

  // Sample news data for right column (without images)
  const rightNews: NewsItem[] = [
    {
      id: 5,
      title: "World's oldest person Tomiko Itooka dies aged 116",
      description: "Ms Itooka lived through two world wars and was credited with a sprightly spirit all her life.",
      category: "Asia",
      time: "3 hrs ago"
    },
    {
      id: 6,
      title: "What one picture tells us about Trump's power in Congress",
      description: "Friday's vote underscores the challenges for Trump in keeping House Republicans united to legislate his agenda.",
      category: "US Politics",
      time: "13 hrs ago"
    },
    {
      id: 7,
      title: "Prince William shocked by death of ex-nanny's stepson",
      description: "Edward Pettifer, whose step-mother was Prince William and Harry's nanny, was among 14 killed.",
      category: "UK",
      time: "Just now"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Featured News */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <img 
            src="https://via.placeholder.com/600x400" 
            alt="Featured news" 
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              Featured Story Title
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              A brief description of the featured story goes here. This should be engaging and make readers want to click through.
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</span>
              <button className="text-blue-600 dark:text-blue-400 hover:underline">Read more</button>
            </div>
          </div>
        </div>

        {/* Latest News Grid */}
        <div className="grid grid-rows-2 gap-6">
          {[1, 2].map((item) => (
            <div key={item} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="flex h-full">
                <img 
                  src="https://via.placeholder.com/300x200" 
                  alt="News thumbnail" 
                  className="w-1/3 object-cover"
                />
                <div className="p-4 w-2/3">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Latest News Title {item}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    A brief description of the news story.
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">1 hour ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* News Categories */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <img 
              src="https://via.placeholder.com/400x300" 
              alt="Category thumbnail" 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Category Title {item}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Brief description of this category's latest news.
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Recent News List */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent News</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Recent News Title {item}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                A brief description of the recent news story.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">30 minutes ago</span>
                <button className="text-blue-600 dark:text-blue-400 hover:underline">Read more</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
