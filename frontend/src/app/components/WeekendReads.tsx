'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  publishedAt: Date;
  slug: string;
}

interface WeekendReadsProps {
  articles: Article[];
}

export default function WeekendReads({ articles }: WeekendReadsProps) {
  return (
    <>
      {/* Top divider */}
      <div className="border-t border-gray-200 my-8" />

      <section className="py-12 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Weekend reads</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <Link 
              key={article.id}
              href={`/article/${article.slug}`}
              className="group block"
            >
              <article className="flex flex-col h-full">
                <div className="relative w-full h-64 mb-4 overflow-hidden rounded-lg">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-600">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <time dateTime={article.publishedAt.toISOString()}>
                      {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
                    </time>
                    <span>•</span>
                    <span className="capitalize">{article.category}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom divider */}
      <div className="border-t border-gray-200 my-8" />
    </>
  );
} 