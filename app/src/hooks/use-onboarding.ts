"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "anajakdoc_onboarding";

interface OnboardingState {
  welcomeShown: boolean;
  tourCompleted: boolean;
  checklistDismissed: boolean;
  completedItems: string[];
}

const defaultState: OnboardingState = {
  welcomeShown: false,
  tourCompleted: false,
  checklistDismissed: false,
  completedItems: [],
};

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading onboarding state:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: OnboardingState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  }, []);

  const markWelcomeShown = useCallback(() => {
    saveState({ ...state, welcomeShown: true });
  }, [state, saveState]);

  const markTourCompleted = useCallback(() => {
    saveState({ ...state, tourCompleted: true });
  }, [state, saveState]);

  const dismissChecklist = useCallback(() => {
    saveState({ ...state, checklistDismissed: true });
  }, [state, saveState]);

  const completeChecklistItem = useCallback((itemId: string) => {
    if (!state.completedItems.includes(itemId)) {
      saveState({
        ...state,
        completedItems: [...state.completedItems, itemId],
      });
    }
  }, [state, saveState]);

  const resetOnboarding = useCallback(() => {
    saveState(defaultState);
  }, [saveState]);

  const restartTour = useCallback(() => {
    saveState({ ...state, tourCompleted: false });
  }, [state, saveState]);

  // Computed values
  const shouldShowWelcome = isLoaded && !state.welcomeShown;
  const shouldShowTour = isLoaded && state.welcomeShown && !state.tourCompleted;
  const shouldShowChecklist = isLoaded && !state.checklistDismissed;

  return {
    state,
    isLoaded,
    shouldShowWelcome,
    shouldShowTour,
    shouldShowChecklist,
    markWelcomeShown,
    markTourCompleted,
    dismissChecklist,
    completeChecklistItem,
    resetOnboarding,
    restartTour,
  };
}
