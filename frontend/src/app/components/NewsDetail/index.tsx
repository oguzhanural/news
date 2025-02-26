'use client';

import { useState } from 'react';
import NewsHeader from './NewsHeader';
import NewsImage from './NewsImage';
import NewsContent from './NewsContent';
import RelatedNews from './RelatedNews';

interface Author {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  publishedAt: Date;
  category: string;
  slug: string;
}

interface NewsDetailProps {
  title: string;
  publishedAt: Date;
  authors: Author[];
  mainImage: {
    url: string;
    caption: string;
    altText: string;
    credit?: string;
  };
  content: string;
  tags: Tag[];
  relatedArticles: RelatedArticle[];
}

export default function NewsDetail({
  title,
  publishedAt,
  authors,
  mainImage,
  content,
  tags,
  relatedArticles
}: NewsDetailProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Add your save logic here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    }
  };

  const handleTagClick = (tag: Tag) => {
    // Add your tag click logic here
    console.log('Tag clicked:', tag);
  };

  return (
    <main className="min-h-screen py-8">
      <NewsHeader
        title={title}
        publishedAt={publishedAt}
        authors={authors}
        onSave={handleSave}
        onShare={handleShare}
      />
      
      <NewsImage
        imageUrl={mainImage.url}
        caption={mainImage.caption}
        altText={mainImage.altText}
        credit={mainImage.credit}
      />
      
      <NewsContent
        content={content}
        tags={tags}
        onTagClick={handleTagClick}
      />
      
      <RelatedNews articles={relatedArticles} />
    </main>
  );
}

// Export all components for individual use if needed
export { NewsHeader, NewsImage, NewsContent, RelatedNews }; 