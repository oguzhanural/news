import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}; 