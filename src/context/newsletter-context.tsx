"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

interface NewsletterContextValue {
  lastSubscribedEmail: string;
  setLastSubscribedEmail: (email: string) => void;
}

const NewsletterContext = createContext<NewsletterContextValue | null>(null);

export function NewsletterProvider({ children }: PropsWithChildren) {
  const [lastSubscribedEmail, setLastSubscribedEmail] = useState("");

  const value = useMemo(
    () => ({
      lastSubscribedEmail,
      setLastSubscribedEmail,
    }),
    [lastSubscribedEmail],
  );

  return (
    <NewsletterContext.Provider value={value}>
      {children}
    </NewsletterContext.Provider>
  );
}

export function useNewsletterContext(): NewsletterContextValue {
  const context = useContext(NewsletterContext);
  if (!context) {
    throw new Error("useNewsletterContext must be used within NewsletterProvider");
  }

  return context;
}
