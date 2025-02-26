'use client';

import Image from 'next/image';

interface NewsImageProps {
  imageUrl: string;
  caption: string;
  altText: string;
  credit?: string;
}

export default function NewsImage({
  imageUrl,
  caption,
  altText,
  credit
}: NewsImageProps) {
  return (
    <figure className="max-w-4xl mx-auto px-4 my-8">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 850px"
          priority
        />
      </div>
      
      <figcaption className="mt-3 text-sm text-gray-600">
        <p>{caption}</p>
        {credit && (
          <p className="mt-1 text-gray-500 text-xs">
            Image credit: {credit}
          </p>
        )}
      </figcaption>
    </figure>
  );
} 