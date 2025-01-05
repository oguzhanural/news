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

export default function HomePage() {
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
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
        {/* Left Column - 1 unit width */}
        <div className="md:col-span-1 space-y-6">
          {leftNews.map((news) => (
            <Link href={`/news/${news.id}`} key={news.id}>
              <div className={`group cursor-pointer`}>
                <div className="relative h-40 mb-3">
                  <Image
                    src={news.imageUrl!}
                    alt={news.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="text-lg font-bold mb-2 group-hover:underline line-clamp-2">{news.title}</h2>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                  {news.description}
                </p>
                <div className="text-xs">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {news.time} | {news.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Middle Column - 4 units width */}
        <div className="md:col-span-4 relative overflow-hidden">
          <div 
            className="transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="flex">
              {middleNews.map((news) => (
                <div key={news.id} className="w-full flex-shrink-0">
                  <Link href={`/news/${news.id}`}>
                    <div className={`group cursor-pointer`}>
                      <div className="relative h-96 mb-4">
                        <Image
                          src={news.imageUrl!}
                          alt={news.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h2 className="text-3xl font-bold mb-3 group-hover:underline">{news.title}</h2>
                      <p className={`text-lg mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {news.description}
                      </p>
                      <div className="text-sm">
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {news.time} | {news.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2 pb-4">
            {middleNews.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  currentSlide === index 
                    ? 'bg-blue-500' 
                    : `${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Right Column - 1 unit width */}
        <div className="md:col-span-1 space-y-6">
          {rightNews.map((news) => (
            <Link href={`/news/${news.id}`} key={news.id}>
              <div className={`group cursor-pointer pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className="text-lg font-bold mb-2 group-hover:underline line-clamp-2">{news.title}</h2>
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                  {news.description}
                </p>
                <div className="text-xs">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {news.time} | {news.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
