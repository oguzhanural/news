'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import WeekendReads from './components/WeekendReads';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  category: string;
  time: string;
  imageUrl?: string; // Made optional for right column
}

// Sample data for weekend reads
const weekendArticles = [
  {
    id: '1',
    title: "The mystery of why Jane Austen's letters were destroyed",
    description: "Austen is one of the greatest writers in the English language – but relatively little is known about her. And that's in part because of an act that infuriates many to this day.",
    imageUrl: "/images/jane-austen.jpg",
    category: "Culture",
    publishedAt: new Date('2024-01-28'),
    slug: 'jane-austen-letters-mystery'
  },
  {
    id: '2',
    title: "A Tibetan snack kneaded to ward off bad luck",
    description: "This ancient snack is synonymous with Tibetan New Year and will soon be prepared by millions of families.",
    imageUrl: "/images/tibetan-snack.jpg",
    category: "Travel",
    publishedAt: new Date('2024-01-30'),
    slug: 'tibetan-new-year-snack'
  }
];

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
    <div className="space-y-8">
      {/* Featured Story */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`md:col-span-2 rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="relative h-[400px]">
            <Image
              src="https://ichef.bbci.co.uk/ace/ws/800/cpsprodpb/609a/live/81a35840-da1c-11ef-b9e5-01711ed04ef7.jpg.webp"
              alt="Featured story"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Featured Story Title</h2>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              A brief description of the featured story goes here. This should be engaging and make readers want to click through.
            </p>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2 hours ago</span>
              <Link href="/story/1" className="text-blue-500 hover:text-blue-600">Read more</Link>
            </div>
          </div>
        </div>

        {/* Latest News Column */}
        <div className="space-y-8 flex flex-col">
          {[1, 2].map((index) => (
            <Link href={`/news/${index}`} key={index}>
              <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} hover:opacity-90 transition-opacity`}>
                <div className="relative h-48">
                  <Image
                    src="/images/latest.jpg"
                    alt={`Latest news ${index}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2">Latest News Title {index}</h3>
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    A brief description of the news story.
                  </p>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>1 hour ago</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((index) => (
          <Link href={`/category/${index}`} key={index}>
            <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} hover:opacity-90 transition-opacity`}>
              <div className="relative h-48">
                <Image
                  src="/images/category.jpg"
                  alt={`Category ${index}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2">Category Title {index}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Brief description of this category's latest news.
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <WeekendReads articles={weekendArticles} />
    </div>
  );
}
