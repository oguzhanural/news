'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in logic here
    console.log('Sign in:', { email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Sign In Form */}
      <div className="w-1/2 bg-black text-white p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="text-4xl font-bold text-center mb-8">NEWS</div>
          
          <h1 className="text-3xl font-bold mb-6">Sign in to News</h1>
          <p className="mb-8 text-gray-300">Welcome back to News</p>

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
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-none focus:outline-none focus:border-white text-white"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-none focus:outline-none focus:border-white text-white"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 hover:bg-blue-700 transition-colors"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              Register now
            </Link>
          </p>

          <p className="mt-8 text-sm text-gray-400">
            <Link href="/help" className="hover:text-white">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Empty Space */}
      <div className="w-1/2 bg-black">
      </div>
    </div>
  );
} 