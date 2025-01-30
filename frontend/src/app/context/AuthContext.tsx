'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'EDITOR' | 'JOURNALIST' | 'ADMIN' | 'READER';
  registrationSource: 'PUBLIC_PORTAL' | 'ADMIN_PORTAL';
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (data: UpdateUserInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // First set the stored user to avoid flicker
          setUser(JSON.parse(storedUser));
          
          // Then validate the token and get fresh user data
          const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: `
                query Me {
                  me {
                    id
                    name
                    email
                    role
                    registrationSource
                    createdAt
                    updatedAt
                  }
                }
              `
            }),
          });
          
          const result = await response.json();
          
          if (!result.errors && result.data?.me) {
            setUser(result.data.me);
            localStorage.setItem('user', JSON.stringify(result.data.me));
          } else {
            // Clear storage if token is invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Login($input: LoginUserInput!) {
              loginUser(input: $input) {
                token
                user {
                  id
                  name
                  email
                  role
                  registrationSource
                  createdAt
                  updatedAt
                }
              }
            }
          `,
          variables: {
            input: { email, password }
          }
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const { token, user } = result.data.loginUser;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Register($input: RegisterUserInput!) {
              registerUser(input: $input) {
                token
                user {
                  id
                  name
                  email
                  role
                  registrationSource
                  createdAt
                  updatedAt
                }
              }
            }
          `,
          variables: {
            input: {
              name,
              email,
              password,
              registrationSource: 'PUBLIC_PORTAL'
            }
          }
        }),
      }).catch(error => {
        throw new Error('Network error: Unable to connect to the server. Please check if the server is running.');
      });

      const result = await response.json();

      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Registration failed';
        throw new Error(errorMessage);
      }

      const { token, user } = result.data.registerUser;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateUser = async (data: UpdateUserInput) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!user?.id) {
        throw new Error('User not found');
      }

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
                registrationSource
                createdAt
                updatedAt
              }
            }
          `,
          variables: {
            id: user.id,
            input: data
          }
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const updatedUser = result.data.updateUser;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 