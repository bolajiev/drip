import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

import { coston2 } from "./lib/config";
import App from "./App";
import "./index.css";

const config = createConfig({
  chains: [coston2],
  connectors: [injected()],
  transports: {
    [coston2.id]: http(),
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
