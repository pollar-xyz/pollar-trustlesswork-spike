"use client";

import { PollarProvider } from "@pollar/react";
import "@pollar/react/styles.css";
import type { ComponentProps, ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PollarProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_POLLAR_API_KEY ?? "",
        // baseUrl: "http://localhost:3052",
      }}
    >
      {/* {children as ComponentProps<typeof PollarProvider>["children"]} */}
      {children}
    </PollarProvider>
  );
}
