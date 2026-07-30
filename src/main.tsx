import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from '@/context/AuthProvider';
import { Toaster } from 'react-hot-toast';
import { client } from '@/lib/appwrite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

// Ping Appwrite backend on startup to verify connectivity
client.ping()
  .then(() => console.log('[Appwrite] ✅ Backend reachable — sportixweb connected'))
  .catch((err: unknown) => console.warn('[Appwrite] ⚠️ Ping failed:', err));

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
              fontFamily: "Urbanist, sans-serif",
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
