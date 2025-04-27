import React from 'react';
import Link from 'next/link';
import BloodSugarWidget from '../components/BloodSugarWidget';
import ConverterForm from '../components/ConverterForm';
import GMI from '../components/GMI';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BloodSugarWidget />
      <GMI /> {/* Added GMI component */}
      <div className="flex items-center justify-center mt-10">
        <ConverterForm />
      </div>
      <div className="text-center mt-6">
        <Link href="/reports" className="text-blue-500 underline">
          View Reports
        </Link>
      </div>
    </div>
  );
};

export default Home;