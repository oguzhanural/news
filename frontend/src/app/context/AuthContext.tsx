'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  updateUser: (data: UpdateUserInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (input: UpdateUserInput) => {
    if (!user?.id) {
      throw new Error('No user found');
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
              updateUser(id: $id, input: $input) {
                id
                name
                email
                role
              }
            }
          `,
          variables: {
            id: user.id,
            input
          },
        }),
      });

      const result = await response.json();
      
      if (result.data?.updateUser) {
        const updatedUser = result.data.updateUser;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else if (result.errors) {
        throw new Error(result.errors[0].message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 