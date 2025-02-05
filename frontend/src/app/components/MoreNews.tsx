'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  category: string;
  timeAgo: string;
  slug: string;
}

interface MoreNewsProps {
  news: NewsItem[];
}

export default function MoreNews({ news }: MoreNewsProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          More news
          <ChevronRight className="w-6 h-6" />
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {news.map((item) => (
          <Link 
            key={item.id}
            href={`/article/${item.slug}`}
            className="group"
          >
            <article>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 line-clamp-3">
                {item.title}
              </h3>
              
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <time>{item.timeAgo}</time>
                <span>•</span>
                <span>{item.category}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
} 