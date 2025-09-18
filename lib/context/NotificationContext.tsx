"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationContextType {
  pendingRequestsCount: number;
  fetchPendingRequests: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const { status } = useSession();

  const fetchPendingRequests = useCallback(async () => {
    if (status === 'authenticated') {
      try {
        const response = await fetch('/api/friends/requests');
        if (response.ok) {
          const requests = await response.json();
          setPendingRequestsCount(requests.length);
        } else {
          setPendingRequestsCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch pending requests:", error);
        setPendingRequestsCount(0);
      }
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPendingRequests(); // Fetch on initial load

      // Poll for new requests every 30 seconds
      const interval = setInterval(fetchPendingRequests, 30000);

      return () => clearInterval(interval);
    }
  }, [status, fetchPendingRequests]);

  return (
    <NotificationContext.Provider value={{ pendingRequestsCount, fetchPendingRequests }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
