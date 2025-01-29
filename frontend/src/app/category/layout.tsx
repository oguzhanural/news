'use client';

import { useAuth } from '../context/AuthContext';

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div>
      {children}
    </div>
  );
} 