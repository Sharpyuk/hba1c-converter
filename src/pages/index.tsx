// import React from 'react';
// import Link from 'next/link';
// import { signIn } from "next-auth/react"; // Import signIn from NextAuth
// // import Layout from '../components/Layout'; // Original import
// import dynamic from 'next/dynamic';
// import BloodSugarWidget from '../components/BloodSugarWidget';
// import ConverterForm from '../components/ConverterForm';
// import GMI from '../components/GMI';


// // Dynamically import Layout to ensure it's client-side rendered
// const Layout = dynamic(() => import('../components/Layout'), { ssr: false });

// const Home = () => {
//   return (
//     <Layout>
//       <div className="min-h-screen bg-gray-50 pt-20 sm:px-6 lg:px-8 w-full">
//         {/* BloodSugarWidget */}
//         <div className="mb-6 w-full max-w-screen-sm mx-auto">
//           <BloodSugarWidget />
//         </div>

//         {/* GMI */}
//         <div className="mb-6 w-full max-w-screen-sm mx-auto">
//           <GMI />
//         </div>

//         {/* ConverterForm */}
//         <div className="flex items-center justify-center mt-10 w-full max-w-screen-sm mx-auto">
//           <ConverterForm />
//         </div>

//         {/* View Reports Link */}
//         <div className="text-center mt-6">
//           <Link href="/reports" className="text-blue-500 underline">
//             View Reports
//           </Link>
//         </div>
//         {/* Sign In Button (example) */}
//         <div className="text-center mt-6">
//           <button
//             onClick={() => signIn("google")} // Trigger Google Sign-In
//             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//           >
//             Sign in with Google
//           </button>
//         </div>
//       </div>
//     </Layout>
//   );
// };




// export default Home;

import React from 'react';
import Link from 'next/link';
import { signIn } from "next-auth/react";
import Layout from '../components/Layout';
import BloodSugarWidget from '../components/BloodSugarWidget';
import ConverterForm from '../components/ConverterForm';
import GMI from '../components/GMI';

const Home = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 sm:px-6 lg:px-8 w-full">
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <BloodSugarWidget />
        </div>

        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <GMI />
        </div>

        <div className="flex items-center justify-center mt-10 w-full max-w-screen-sm mx-auto">
          <ConverterForm />
        </div>

        <div className="text-center mt-6">
          <Link href="/reports" className="text-blue-500 underline">
            View Reports
          </Link>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => signIn("google")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
