'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface RelatedArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  publishedAt: Date;
  category: string;
  slug: string;
}

interface RelatedNewsProps {
  articles: RelatedArticle[];
}

export default function RelatedNews({ articles }: RelatedNewsProps) {
  return (
    <section className="max-w-4xl mx-auto px-4 my-12">
      <h2 className="text-2xl font-bold mb-6">Related Stories</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/story/${article.slug}`}
            className="group"
          >
            <article>
              <div className="relative aspect-[16/9] mb-3 overflow-hidden rounded-lg">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
                />
              </div>
              
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 line-clamp-2">
                {article.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {article.summary}
              </p>
              
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <time dateTime={article.publishedAt.toISOString()}>
                  {formatDistanceToNow(article.publishedAt, { addSuffix: true })}
                </time>
                <span>•</span>
                <span>{article.category}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
} 