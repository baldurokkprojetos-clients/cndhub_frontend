"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const trustedTypes = (window as Window & { trustedTypes?: { createPolicy?: (name: string, policy: { createHTML?: (value: string) => string; createScript?: (value: string) => string; createScriptURL?: (value: string) => string }) => void } }).trustedTypes
    if (!trustedTypes?.createPolicy) {
      return
    }
    try {
      trustedTypes.createPolicy("default", {
        createHTML: (value: string) => value,
        createScript: (value: string) => value,
        createScriptURL: (value: string) => value
      })
    } catch {
      return
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
