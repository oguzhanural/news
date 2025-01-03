'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log('Registration email:', email);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className="w-1/2 bg-black text-white p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="text-4xl font-bold text-center mb-8">NEWS</div>
          
          <h1 className="text-3xl font-bold mb-6">Register for a News account</h1>
          <p className="mb-8 text-gray-300">You must be 16 or over to register for a News account</p>

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

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-center">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-400 hover:text-blue-300">
              Sign in now
            </Link>
          </p>

          <p className="mt-8 text-sm text-gray-400">
            <Link href="/help" className="hover:text-white">
              Find out more about News accounts
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Single Image */}
      <div className="w-1/2 relative">
        <Image
          src="https://img.freepik.com/free-psd/3d-rendering-news-sales-background_23-2150732573.jpg?t=st=1735667996~exp=1735671596~hmac=c23b0e1d7f88261d52beee40e12e7885f5951273f3aecc2c77d73ae321a88540&w=2000"
          alt="News background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
} 