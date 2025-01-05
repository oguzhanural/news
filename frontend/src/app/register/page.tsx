'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '../context/ThemeContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const { isDarkMode } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log('Registration email:', email);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className={`w-1/2 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} p-8 flex flex-col justify-center`}>
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="text-4xl font-bold mb-8">NEWS</div>
          
          <h1 className="text-3xl font-bold mb-6">Register for a News account</h1>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>You must be 16 or over to register for a News account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-transparent border ${
                  isDarkMode ? 'border-gray-600 text-white focus:border-white' : 'border-gray-300 text-black focus:border-black'
                } rounded-none focus:outline-none`}
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 hover:bg-blue-700 transition-colors"
            >
              Continue
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