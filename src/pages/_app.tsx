import React, { createContext, useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { App as CapApp } from '@capacitor/app';

export const AuthContext = createContext<{ token: string | null, setToken: (t: string | null) => void }>({
  token: null,
  setToken: () => {},
});

function MyApp({ Component, pageProps }: AppProps) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Listen for deep link events
    CapApp.addListener('appUrlOpen', (data) => {
      // Example: myapp://auth?token=JWT
      const url = new URL(data.url);
      if (url.pathname === "/auth" && url.searchParams.get("token")) {
        const receivedToken = url.searchParams.get("token");
        setToken(receivedToken);
        localStorage.setItem("authToken", receivedToken!);
      }
    });
    // On mount, restore token from localStorage
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) setToken(storedToken);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;