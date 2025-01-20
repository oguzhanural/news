import jwt from 'jsonwebtoken';

export const verifyToken = async (token: string): Promise<string | null> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}; 