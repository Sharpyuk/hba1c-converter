import React from "react";
import Layout from "../components/Layout";
import ConverterForm from "../components/ConverterForm";
import CarbCalculatorWidget from "../components/CarbCalculatorWidget";

const ToolsPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pt-16 sm:px-6 lg:px-8 w-full">
        <div className="mb-6 w-full max-w-screen-sm mx-auto">
          <CarbCalculatorWidget />
          <ConverterForm />
        </div>
      </div>
    </Layout>
  );
};

export default ToolsPage;