import React, { useState } from 'react';
import {
  convertPercentToMmolMol,
  convertMmolMolToPercent,
  calculateAverageGlucose,
} from '../utils/conversion';

const ConverterForm: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [conversionType, setConversionType] = useState('percentToMmolMol');
  const [result, setResult] = useState<number | null>(null);
  const [averageGlucose, setAverageGlucose] = useState<number | null>(null);

  const handleConvert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return;

    let convertedValue: number | null = null;
    let avgGlucose: number | null = null;

    if (conversionType === 'percentToMmolMol') {
      convertedValue = convertPercentToMmolMol(value);
      avgGlucose = calculateAverageGlucose(value);
    } else if (conversionType === 'mmolMolToPercent') {
      convertedValue = convertMmolMolToPercent(value);
      avgGlucose = calculateAverageGlucose(convertedValue);
    }

    setResult(convertedValue);
    setAverageGlucose(avgGlucose);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        HbA1c Converter
      </h2>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Enter Value
        </label>
        <input
          type="text"
          placeholder="Enter value"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Conversion Type
        </label>
        <select
          value={conversionType}
          onChange={(e) => setConversionType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="percentToMmolMol">Percent to mmol/mol</option>
          <option value="mmolMolToPercent">mmol/mol to Percent</option>
        </select>
      </div>
      <button
        onClick={handleConvert}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
      >
        Convert
      </button>
      {result !== null && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <p className="text-gray-800 font-medium">
            Converted Value: <span className="font-bold">{result.toFixed(2)}</span>
          </p>
          {averageGlucose !== null && (
            <p className="text-gray-800 font-medium">
              Average Glucose (mmol/l):{' '}
              <span className="font-bold">{averageGlucose.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ConverterForm;