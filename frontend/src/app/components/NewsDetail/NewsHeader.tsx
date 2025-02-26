'use client';

import { formatDistanceToNow } from 'date-fns';
import { Share2, Bookmark } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface NewsHeaderProps {
  title: string;
  publishedAt: Date;
  authors: Author[];
  onSave?: () => void;
  onShare?: () => void;
}

export default function NewsHeader({
  title,
  publishedAt,
  authors,
  onSave,
  onShare
}: NewsHeaderProps) {
  return (
    <header className="max-w-4xl mx-auto px-4 pt-8 pb-6">
      <h1 className="text-4xl font-bold leading-tight mb-4">
        {title}
      </h1>
      
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4">
          <time className="text-gray-600" dateTime={publishedAt.toISOString()}>
            {formatDistanceToNow(publishedAt, { addSuffix: true })}
          </time>
          <span className="text-gray-300">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">By</span>
            <div className="flex items-center">
              {authors.map((author, index) => (
                <span key={author.id}>
                  <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    {author.name}
                  </span>
                  {index < authors.length - 1 && <span className="mx-1">,</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onShare}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            aria-label="Share article"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
          
          <button
            onClick={onSave}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            aria-label="Save article"
          >
            <Bookmark className="w-5 h-5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </header>
  );
} 