'use client';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface NewsContentProps {
  content: string;
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
}

export default function NewsContent({
  content,
  tags,
  onTagClick
}: NewsContentProps) {
  return (
    <article className="max-w-4xl mx-auto px-4">
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        {content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-6 text-gray-800 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      
      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-12 mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagClick?.(tag)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full 
                         text-sm font-medium transition-colors duration-200"
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
} 