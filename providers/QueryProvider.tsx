"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Show cached data immediately — no blank screen on revisit
                        staleTime: 5 * 60 * 1000,   // 5 min: data is "fresh", no refetch
                        gcTime: 10 * 60 * 1000,      // 10 min: keep in memory between tabs
                        refetchOnWindowFocus: false,  // Don't refetch when switching windows
                        retry: 1,                     // Only retry once on failure
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
