// import type { NextApiRequest, NextApiResponse } from 'next';
// import crypto from 'crypto';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { carbs, glucose, notes } = req.body;

//   const entry: any = {
//     eventType: "Carb Correction",
//     carbs: 4,
//     enteredBy: "hba1c-converter",
//     glucose: glucose,
//     notes: notes
//   };

//   if (glucose !== undefined) entry.glucose = glucose;
//   if (notes) entry.notes = notes;

//   const NIGHTSCOUT_URL = process.env.NIGHTSCOUT_URL;
//   const NIGHTSCOUT_API_SECRET = process.env.NIGHTSCOUT_API_SECRET;

//   const hashedSecret = NIGHTSCOUT_API_SECRET
//     ? crypto.createHash('sha1').update(NIGHTSCOUT_API_SECRET).digest('hex')
//     : '';

//   try {
//     const response = await fetch(`${NIGHTSCOUT_URL}/api/v1/treatments`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': '*/*',
//         'API-SECRET': hashedSecret,
//       },
//       body: JSON.stringify(entry),
//     });

//     const text = await response.text();

//     if (!response.ok) {
//       return res.status(500).json({ error: text || 'Failed to add treatment to Nightscout' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Hypo treatment entry added to Nightscout.',
//       date: new Date().toISOString(),
//       nightscoutResponse: text,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ error: error.message });
//   }
// }

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { query } from '../../utils/db';
import { decrypt } from '../../utils/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get session
  // const session = await getServerSession(req, res, authOptions);
  // console.log("SESSION:", session);
  // if (!session?.user?.id) {
  //   return res.status(401).json({ error: 'Not authenticated' });
  // }

  
  console.log("HANDLER CALLED");
  const session = await getServerSession(req, res, authOptions) as { user?: { email?: string } } | null;
  console.log("SESSION:", session);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Fetch user's Nightscout settings from DB
  // const userSettingsResult = await query(
  //   'SELECT nightscout_address, nightscout_api_secret FROM user_settings WHERE user_id = $1',
  //   [session.user.id]
  // );
  // const userSettings = userSettingsResult.rows?.[0] || userSettingsResult[0];
  // if (!userSettings?.nightscout_address || !userSettings?.nightscout_api_secret) {
  //   return res.status(400).json({ error: 'Nightscout settings not found for user' });
  // }
 const userSettingsResult = await query(
    'SELECT nightscout_address, nightscout_api_secret FROM user_settings WHERE user_id = $1',
    [session.user.email]
  );
  const userSettings = userSettingsResult.rows?.[0] || userSettingsResult[0];
  if (!userSettings?.nightscout_address || !userSettings?.nightscout_api_secret) {
    return res.status(400).json({ error: 'Nightscout settings not found for user' });
  }

  const NIGHTSCOUT_URL = userSettings.nightscout_address.replace(/\/$/, '');
  const NIGHTSCOUT_API_SECRET = decrypt(userSettings.nightscout_api_secret);

  const { carbs, glucose, notes } = req.body;

  const entry: any = {
    eventType: "Carb Correction",
    carbs: carbs ?? 4,
    enteredBy: "hba1c-converter",
  };
  if (glucose !== undefined) entry.glucose = glucose;
  if (notes) entry.notes = notes;

  const hashedSecret = NIGHTSCOUT_API_SECRET
    ? crypto.createHash('sha1').update(NIGHTSCOUT_API_SECRET).digest('hex')
    : '';

  try {
    console.log("SESSION:", session);
    console.log("USER SETTINGS RESULT:", userSettingsResult);
    console.log("USER SETTINGS:", userSettings);
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