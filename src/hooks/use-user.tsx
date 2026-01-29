"use client";

import { createContext, useContext } from "react";

interface UserContextValue {
  userId: string | null;
  avatarUrl: string | null;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  avatarUrl: null,
});

export function UserProvider({
  userId,
  avatarUrl,
  children,
}: UserContextValue & { children: React.ReactNode }) {
  return (
    <UserContext.Provider value={{ userId, avatarUrl }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
