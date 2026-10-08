"use client";

import React, { createContext, useContext } from "react";
import type { StoreSettingsData } from "./settings-repository";
import { DEFAULT_STORE_SETTINGS } from "./settings-repository";

interface StoreSettingsContextValue {
  settings: StoreSettingsData;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue>({
  settings: DEFAULT_STORE_SETTINGS,
});

export function StoreSettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettingsData;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={{ settings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(): StoreSettingsData {
  const ctx = useContext(StoreSettingsContext);
  return ctx?.settings || DEFAULT_STORE_SETTINGS;
}
