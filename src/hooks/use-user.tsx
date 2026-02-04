"use client";

import { createContext, useContext } from "react";

interface UserContextValue {
  userId: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  avatarUrl: null,
  isAdmin: false,
});

export function UserProvider({
  userId,
  avatarUrl,
  isAdmin,
  children,
}: UserContextValue & { children: React.ReactNode }) {
  return (
    <UserContext.Provider value={{ userId, avatarUrl, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
