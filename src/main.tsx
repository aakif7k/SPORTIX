import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#181818",
              color: "#FFFFFF",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
              fontFamily: "DM Mono, monospace",
              fontSize: "13px",
            },
            success: {
              iconTheme: { primary: "#CCFF00", secondary: "#080808" },
              style: {
                borderLeft: "3px solid #CCFF00",
              },
            },
            error: {
              iconTheme: { primary: "#F87171", secondary: "#080808" },
              style: {
                borderLeft: "3px solid #F87171",
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
