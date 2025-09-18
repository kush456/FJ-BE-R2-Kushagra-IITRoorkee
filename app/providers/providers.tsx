'use client';
import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from '@/lib/context/NotificationContext';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  );
};