'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  date: string;
  slug: string;
}

interface EditorsPicksProps {
  articles: Article[];
}

export default function EditorsPicks({ articles }: EditorsPicksProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === articles.length - 1 ? 0 : prevIndex + 1
    );
  };

  const previousSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? articles.length - 1 : prevIndex - 1
    );
  };

  return (
    <section className="bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Editor&apos;s picks</h2>
          <div className="flex gap-2">
            <button
              onClick={previousSlide}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {articles.map((article, index) => {
            const isActive = index === currentIndex;
            const isNext = (index === currentIndex + 1) || (currentIndex === articles.length - 1 && index === 0);
            
            return (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className={`group transition-opacity duration-300 ${
                  !isActive && !isNext ? 'hidden md:block' : ''
                }`}
              >
                <article className="relative">
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                      {article.description}
                    </p>
                    
                    <div className="flex items-center mt-3 text-sm text-gray-400 space-x-2">
                      <time dateTime={article.date}>{article.date}</time>
                      <span>•</span>
                      <span>{article.category}</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
} 