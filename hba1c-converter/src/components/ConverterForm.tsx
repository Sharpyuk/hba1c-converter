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
    <div>
      <h2>HbA1c Converter</h2>
      <input
        type="text"
        placeholder="Enter value"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <select
        value={conversionType}
        onChange={(e) => setConversionType(e.target.value)}
      >
        <option value="percentToMmolMol">Percent to mmol/mol</option>
        <option value="mmolMolToPercent">mmol/mol to Percent</option>
      </select>
      <button onClick={handleConvert}>Convert</button>
      {result !== null && (
        <div>
          <p>Converted Value: {result.toFixed(2)}</p>
          {averageGlucose !== null && (
            <p>Average Glucose (mmol/l): {averageGlucose.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ConverterForm;