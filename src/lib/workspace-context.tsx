"use client";

import { createContext, useContext, type ReactNode } from "react";

const ActiveWorkspaceContext = createContext("green-cross");

export function ActiveWorkspaceProvider({
  pharmacyId,
  children,
}: {
  pharmacyId: string;
  children: ReactNode;
}) {
  return (
    <ActiveWorkspaceContext.Provider value={pharmacyId}>
      {children}
    </ActiveWorkspaceContext.Provider>
  );
}

export function useActivePharmacyId(): string {
  return useContext(ActiveWorkspaceContext);
}
