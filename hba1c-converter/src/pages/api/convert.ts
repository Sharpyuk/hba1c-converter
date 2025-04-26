import { NextApiRequest, NextApiResponse } from 'next';
import { convertPercentToMmolMol, convertMmolMolToPercent, calculateAverageGlucose } from '../../utils/conversion';

// Example usage of the imported functions
export default function handler(req, res) {
  const { value, type } = req.query;

  if (type === 'percentToMmolMol') {
    const result = convertPercentToMmolMol(parseFloat(value));
    res.status(200).json({ result });
  } else if (type === 'mmolMolToPercent') {
    const result = convertMmolMolToPercent(parseFloat(value));
    res.status(200).json({ result });
  } else {
    res.status(400).json({ error: 'Invalid conversion type' });
  }
}
}