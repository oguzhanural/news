import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import { isValidCloudinaryUrl } from './cloudinary';

// Configure DOMPurify with JSDOM
const window = new JSDOM('').window;

/**
 * Configure DOMPurify with allowed tags and attributes
 */
DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img',
    'figure', 'figcaption', 'pre', 'code'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'class', 'title',
    'width', 'height', 'style', 'data-caption'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  ADD_TAGS: ['iframe'],
  WHOLE_DOCUMENT: false,
  SANITIZE_DOM: true
});

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param content HTML content to sanitize
 * @returns Sanitized HTML content
 */
export const sanitizeContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
};

/**
 * Extract all image URLs from HTML content
 * @param content HTML content
 * @returns Array of image URLs
 */
export const extractImagesFromContent = (content: string): string[] => {
  try {
    const dom = new JSDOM(content);
    const images = dom.window.document.querySelectorAll('img');
    const imageUrls: string[] = [];
    
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        imageUrls.push(src);
      }
    });
    
    return imageUrls;
  } catch (error) {
    console.error('Error extracting images from content:', error);
    return [];
  }
};

/**
 * Validate all images in content are from Cloudinary
 * @param content HTML content with images
 * @returns Boolean indicating if all images are valid Cloudinary URLs
 */
export const validateContentImages = (content: string): boolean => {
  const imageUrls = extractImagesFromContent(content);
  
  if (imageUrls.length === 0) {
    return true; // No images to validate
  }
  
  return imageUrls.every(url => isValidCloudinaryUrl(url));
};

/**
 * Create a summary from HTML content
 * @param content HTML content
 * @param maxLength Maximum length of summary
 * @returns Plain text summary
 */
export const createSummaryFromContent = (content: string, maxLength = 160): string => {
  try {
    const dom = new JSDOM(content);
    const text = dom.window.document.body.textContent || '';
    
    // Clean up whitespace and limit length
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= maxLength) {
      return cleanText;
    }
    
    // Find a good break point (end of sentence or space)
    const truncated = cleanText.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    const breakPoint = lastPeriod > 0 ? lastPeriod + 1 : lastSpace;
    return cleanText.substring(0, breakPoint > 0 ? breakPoint : maxLength) + '...';
  } catch (error) {
    console.error('Error creating summary:', error);
    return content.substring(0, maxLength) + '...';
  }
};

/**
 * Count words in HTML content
 * @param content HTML content
 * @returns Number of words
 */
export const countWords = (content: string): number => {
  try {
    const dom = new JSDOM(content);
    const text = dom.window.document.body.textContent || '';
    return text.trim().split(/\s+/).length;
  } catch (error) {
    console.error('Error counting words:', error);
    return 0;
  }
};

/**
 * Process content from rich text editor to prepare for saving
 * @param content HTML content from rich text editor
 * @returns Processed and sanitized content
 */
export const processRichTextContent = (content: string): string => {
  // First sanitize to remove any malicious content
  const sanitized = sanitizeContent(content);
  
  // Additional processing could be added here
  // For example, optimizing images, adding CSS classes, etc.
  
  return sanitized;
}; 