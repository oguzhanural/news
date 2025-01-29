'use client';

import { useParams } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';

export default function CategoryPage() {
  const params = useParams();
  const { isDarkMode } = useTheme();
  const categorySlug = params.slug as string;

  // Capitalize the first letter of the category name
  const categoryName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{categoryName}</h1>
      
      {/* Temporary placeholder content */}
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Content for {categoryName} category coming soon...
        </p>
      </div>
    </div>
  );
} 