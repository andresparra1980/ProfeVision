"use client";

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client'; // Corrected import

const INACTIVITY_TIMEOUT = 4 * 60 * 1000; // 4 minutes

export function useKeepAliveSession() {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const refreshSession = useCallback(async () => {
    console.log('Refreshing session due to inactivity...');
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error.message);
      // Optional: Handle refresh error, e.g., logout user
      // await supabase.auth.signOut();
    } else {
      console.log('Session refreshed successfully.');
    }
    // Reset the timer after attempting refresh regardless of outcome
    resetTimer();
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(refreshSession, INACTIVITY_TIMEOUT);
    // console.log('Inactivity timer reset.'); // Uncomment for debugging
  }, [refreshSession]);

  const handleActivity = useCallback(() => {
    // console.log('User activity detected.'); // Uncomment for debugging
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Initial setup
    resetTimer();

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Cleanup function
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      // console.log('Keep-alive listeners removed.'); // Uncomment for debugging
    };
  }, [handleActivity, resetTimer]); // Dependencies for useEffect

  // No return value needed, the hook just performs side effects
} 