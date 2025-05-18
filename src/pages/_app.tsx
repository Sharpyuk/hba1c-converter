// // import { SessionProvider } from "next-auth/react"; // Original import
// import React, { useState, useEffect } from 'react';
// import dynamic from 'next/dynamic';
// import '../styles/globals.css';

// // Dynamically import SessionProvider to ensure it's client-side rendered
// const SessionProvider = dynamic(
//   () => import("next-auth/react").then((mod) => mod.SessionProvider),
//   { ssr: false }
// );

// function MyApp({ Component, pageProps }) {
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   if (!isMounted) {
//     // Return null (or a loading spinner) until the component has mounted on the client.
//     // This prevents SessionProvider and its internal hooks from running prematurely.
//     return null;
//   }

//   return (
//     <SessionProvider>
//       <Component {...pageProps} />
//     </SessionProvider>
//   );
// }
// export default MyApp;


// src/pages/_app.tsx
import React from 'react';
import { SessionProvider } from "next-auth/react";
import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;

