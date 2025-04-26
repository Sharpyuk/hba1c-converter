import React from 'react';
import BloodSugarWidget from '../components/BloodSugarWidget';
import ConverterForm from '../components/ConverterForm';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BloodSugarWidget />
      <div className="flex items-center justify-center mt-10">
        <ConverterForm />
      </div>
    </div>
  );
};

export default Home;