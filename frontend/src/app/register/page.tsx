'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'EDITOR' | 'JOURNALIST';
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'JOURNALIST'
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { setUser } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation RegisterUser($input: RegisterUserInput!) {
              registerUser(input: $input) {
                token
                user {
                  id
                  name
                  email
                  role
                }
              }
            }
          `,
          variables: {
            input: {
              name: formData.name,
              email: formData.email,
              password: formData.password,
              role: formData.role
            }
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setErrors({
          general: data.errors[0].message || 'Registration failed'
        });
        return;
      }

      // Store the token and user data
      localStorage.setItem('token', data.data.registerUser.token);
      localStorage.setItem('user', JSON.stringify(data.data.registerUser.user));
      
      // Update auth context
      setUser(data.data.registerUser.user);

      // Redirect to home page
      router.push('/');

    } catch (error) {
      setErrors({
        general: 'An error occurred during registration. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className={`w-1/2 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} p-8 flex flex-col justify-center`}>
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="text-4xl font-bold mb-8">NEWS</div>
          
          <h1 className="text-3xl font-bold mb-6">Register for a News account</h1>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Join our news platform as a journalist or editor</p>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-transparent border ${
                  isDarkMode ? 'border-gray-600 text-white focus:border-white' : 'border-gray-300 text-black focus:border-black'
                } rounded-none focus:outline-none ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-transparent border ${
                  isDarkMode ? 'border-gray-600 text-white focus:border-white' : 'border-gray-300 text-black focus:border-black'
                } rounded-none focus:outline-none ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-transparent border ${
                  isDarkMode ? 'border-gray-600 text-white focus:border-white' : 'border-gray-300 text-black focus:border-black'
                } rounded-none focus:outline-none ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Create a password"
              />
              {errors.password ? (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 6 characters long, contain uppercase, lowercase, and number.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-transparent border ${
                  isDarkMode ? 'border-gray-600 text-white focus:border-white' : 'border-gray-300 text-black focus:border-black'
                } rounded-none focus:outline-none ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-transparent border ${
                  isDarkMode ? 'border-gray-600 text-white focus:border-white' : 'border-gray-300 text-black focus:border-black'
                } rounded-none focus:outline-none`}
              >
                <option value="JOURNALIST">Journalist</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white py-3 px-4 hover:bg-blue-700 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-500 hover:text-blue-400">
              Sign in now
            </Link>
          </p>

          <p className={`mt-8 text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            <Link href="/help">
              Find out more about News accounts
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Empty Space */}
      <div className={`w-1/2 ${isDarkMode ? 'bg-black' : 'bg-gray-100'}`}>
      </div>
    </div>
  );
} 