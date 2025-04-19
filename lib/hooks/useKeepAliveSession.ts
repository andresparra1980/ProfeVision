"use client";

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger'; // Ensure correct logger import

const INACTIVITY_TIMEOUT = 4 * 60 * 1000; // 4 minutes

export function useKeepAliveSession() {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  // Ref to hold the latest refreshSession function, initialize with null
  const refreshSessionRef = useRef<(() => Promise<void>) | null>(null);

  // Define resetTimer first. It calls refreshSession via ref.
  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    // Schedule the call using the function currently in the ref
    if (refreshSessionRef.current) {
      timeoutId.current = setTimeout(refreshSessionRef.current, INACTIVITY_TIMEOUT);
    }
    // logger.log('Inactivity timer reset.');
  }, []); // resetTimer itself has no external dependencies for useCallback

  // Define the actual refreshSession logic
  const refreshSession = useCallback(async () => {
    logger.log('Refreshing session due to inactivity...');
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      logger.error('Error refreshing session:', error.message);
    } else {
      logger.log('Session refreshed successfully.');
    }
    // After refreshing, reset the timer again
    resetTimer();
  }, [resetTimer]); // refreshSession depends on the stable resetTimer

  // Keep the ref pointing to the latest stable version of refreshSession
  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  // handleActivity calls the stable resetTimer
  const handleActivity = useCallback(() => {
    // logger.log('User activity detected.');
    resetTimer();
  }, [resetTimer]);

  // Main useEffect for setup and cleanup
  useEffect(() => {
    resetTimer(); // Initial setup call

    // Add event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Cleanup function
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      // Remove event listeners
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [handleActivity, resetTimer]);

}
// Removed conflicting logger definition 