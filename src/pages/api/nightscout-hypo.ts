// filepath: [nightscout-hypo.ts](http://_vscodecontentref_/0)
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const entry = {
    eventType: "Carb Correction",
    carbs: 4,
    enteredBy: "hba1c-converter"
  };

  const NIGHTSCOUT_URL = process.env.NIGHTSCOUT_URL;
  const NIGHTSCOUT_API_SECRET = process.env.NIGHTSCOUT_API_SECRET;

  // Hash the secret using SHA1
  const hashedSecret = NIGHTSCOUT_API_SECRET
    ? crypto.createHash('sha1').update(NIGHTSCOUT_API_SECRET).digest('hex')
    : '';

  try {
    console.log('API Secret (hashed):', hashedSecret);
    console.log('Nightscout URL:', NIGHTSCOUT_URL);

    const response = await fetch(`${NIGHTSCOUT_URL}/api/v1/treatments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'API-SECRET': hashedSecret,
      },
      body: JSON.stringify(entry),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({ error: text || 'Failed to add treatment to Nightscout' });
    }

    return res.status(200).json({
      success: true,
      message: 'Hypo treatment entry added to Nightscout.',
      date: new Date().toISOString(),
      nightscoutResponse: text,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}