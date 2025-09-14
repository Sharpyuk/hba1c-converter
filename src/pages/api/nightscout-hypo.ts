import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";
import { query } from '../../utils/db';
import { decrypt } from '../../utils/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions) as { user?: { email?: string } } | null;
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Get personId from query or body (for DELETE, PUT, POST)
  const personId = req.query.personId || req.body.personId || session.user.email;

  let nightscoutAddress: string | undefined;
  let nightscoutApiSecret: string | undefined;

  if (personId === session.user.email) {
    // Default user
    const userSettingsResult = await query(
      'SELECT nightscout_address, nightscout_api_secret FROM user_settings WHERE user_id = $1',
      [session.user.email]
    );
    const userSettings = userSettingsResult.rows?.[0] || userSettingsResult[0];
    nightscoutAddress = userSettings?.nightscout_address;
    nightscoutApiSecret = userSettings?.nightscout_api_secret;
  } else {
    // Managed person
    const personResult = await query(
      'SELECT nightscout_address, nightscout_api_secret FROM people WHERE user_id = $1 AND name = $2',
      [session.user.email, personId]
    );
    const person = personResult.rows?.[0] || personResult[0];
    nightscoutAddress = person?.nightscout_address;
    nightscoutApiSecret = person?.nightscout_api_secret;
  }

  if (!nightscoutAddress || !nightscoutApiSecret) {
    return res.status(400).json({ error: 'Nightscout settings not found for person' });
  }

  const NIGHTSCOUT_URL = nightscoutAddress.replace(/\/$/, '');
  const NIGHTSCOUT_API_SECRET = decrypt(nightscoutApiSecret);
  const hashedSecret = NIGHTSCOUT_API_SECRET
    ? crypto.createHash('sha1').update(NIGHTSCOUT_API_SECRET).digest('hex')
    : '';

  if (req.method === "DELETE") {
    const { id } = req.query;
    const response = await fetch(`${NIGHTSCOUT_URL}/api/v1/treatments/${id}`, {
      method: "DELETE",
      headers: {
        'API-SECRET': hashedSecret,
      },
    });
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to delete treatment" });
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === "PUT") {
    const { id, carbs, insulin, glucose, notes } = req.body;
    const entry: any = {};
    if (carbs !== undefined) entry.carbs = carbs;
    if (insulin !== undefined) entry.insulin = insulin;
    if (glucose !== undefined) entry.glucose = glucose;
    if (notes !== undefined) entry.notes = notes;
    const response = await fetch(`${NIGHTSCOUT_URL}/api/v1/treatments/${id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'API-SECRET': hashedSecret,
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to update treatment" });
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === "POST") {
    const { carbs, glucose, notes } = req.body;
    const entry: any = {
      eventType: "Carb Correction",
      carbs: carbs ?? 4,
      enteredBy: "hba1c-converter",
    };
    if (glucose !== undefined) entry.glucose = glucose;
    if (notes) entry.notes = notes;

    try {
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

  // If method not handled
  return res.status(405).json({ error: 'Method not allowed' });
}