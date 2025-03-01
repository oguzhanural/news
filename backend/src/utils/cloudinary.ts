import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Validates if a URL is a legitimate Cloudinary URL
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is a valid Cloudinary URL
 */
export const isValidCloudinaryUrl = (url: string): boolean => {
  // Basic validation - check if URL contains cloudinary domain
  if (!url) return false;
  
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

/**
 * Extract public ID from a Cloudinary URL
 * @param url Cloudinary URL
 * @returns Public ID or null if not a valid Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  if (!isValidCloudinaryUrl(url)) return null;
  
  try {
    // Extract the path after upload/
    const uploadRegex = /\/upload\/(?:v\d+\/)?([^/]+)\.\w+$/;
    const match = url.match(uploadRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return null;
  }
};

/**
 * Delete an image from Cloudinary
 * @param publicId The public ID of the image to delete
 * @returns Promise that resolves to the deletion result
 */
export const deleteCloudinaryImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

/**
 * Delete an image from Cloudinary using its URL
 * @param url The Cloudinary URL of the image to delete
 * @returns Promise that resolves to the deletion result
 */
export const deleteCloudinaryImageByUrl = async (url: string): Promise<boolean> => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;
  
  return await deleteCloudinaryImage(publicId);
};

/**
 * Check if Cloudinary is properly configured
 * @returns Boolean indicating if Cloudinary is configured
 */
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export default cloudinary; 