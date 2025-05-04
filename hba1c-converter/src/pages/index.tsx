import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import BloodSugarWidget from '../components/BloodSugarWidget';
import ConverterForm from '../components/ConverterForm';
import GMI from '../components/GMI';

const Home = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-20 px-4 sm:px-6 lg:px-8">
        {/* BloodSugarWidget */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <BloodSugarWidget />
        </div>

        {/* GMI */}
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <GMI />
        </div>

        {/* ConverterForm */}
        <div className="flex items-center justify-center mt-10 w-full max-w-screen-sm mx-auto">
          <ConverterForm />
        </div>

        {/* View Reports Link */}
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