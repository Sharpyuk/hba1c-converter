import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import BloodSugarWidget from '../components/BloodSugarWidget';
import ConverterForm from '../components/ConverterForm';
import GMI from '../components/GMI';

const Home = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-16 sm:px-6 lg:px-8 w-full">
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
      </div>
    </Layout>
  );
};

export default Home;