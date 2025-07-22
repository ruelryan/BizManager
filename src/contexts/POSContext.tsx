import React, { createContext, useContext, useState } from 'react';

interface POSContextType {
  isPOSActive: boolean;
  setPOSActive: (active: boolean) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: React.ReactNode }) {
  const [isPOSActive, setIsPOSActive] = useState(false);

  const setPOSActive = (active: boolean) => {
    setIsPOSActive(active);
  };

  return (
    <POSContext.Provider value={{ isPOSActive, setPOSActive }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}