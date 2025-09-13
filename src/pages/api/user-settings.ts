import { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../utils/db";
import { encrypt, decrypt } from "../../utils/encryption";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case "GET": {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      try {
        // Fetch default user
        const result = await query("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
        let defaultUser = null;
        if (result.rows.length > 0) {
          const settings = result.rows[0];
          let nightscoutApiSecret = null;
          if (settings.nightscout_api_secret) {
            try {
              nightscoutApiSecret = decrypt(settings.nightscout_api_secret);
            } catch {
              nightscoutApiSecret = null;
            }
          }
          defaultUser = {
            name: settings.name || "Me",
            nightscout_address: settings.nightscout_address,
            nightscout_api_secret: nightscoutApiSecret,
          };
        }

        // Fetch managed people
        const peopleResult = await query(
          "SELECT name, nightscout_address, nightscout_api_secret FROM people WHERE user_id = $1",
          [userId]
        );
        const people = (peopleResult.rows || peopleResult).map((p: any) => ({
          ...p,
          nightscout_api_secret: p.nightscout_api_secret
            ? (() => { try { return decrypt(p.nightscout_api_secret); } catch { return null; } })()
            : null,
        }));

        return res.status(200).json({
          defaultUser,
          people,
        });
      } catch (error) {
        return res.status(500).json({ error: "Database error" });
      }
    }

    case "POST": {
  const { userId, people, nightscoutAddress, nightscoutApiSecret, defaultName } = req.body;

  // Save managed people
  if (userId && Array.isArray(people)) {
    try {
      await query("DELETE FROM people WHERE user_id = $1", [userId]);
      for (const person of people) {
        await query(
          "INSERT INTO people (user_id, name, nightscout_address, nightscout_api_secret) VALUES ($1, $2, $3, $4)",
          [
            userId,
            person.name,
            person.nightscout_address,
            person.nightscout_api_secret ? encrypt(person.nightscout_api_secret) : "",
          ]
        );
      }
      return res.status(200).json({ message: "People updated" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Database error" });
    }
  }

  // Save default user
  if (userId && nightscoutAddress !== undefined && nightscoutApiSecret !== undefined) {
    try {
      const encryptedSecret = encrypt(nightscoutApiSecret);
      await query(
        `INSERT INTO user_settings (user_id, name, nightscout_address, nightscout_api_secret)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET name = $2, nightscout_address = $3, nightscout_api_secret = $4`,
        [userId, defaultName || "Me", nightscoutAddress, encryptedSecret]
      );
      return res.status(200).json({ message: "Settings saved successfully" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Database error" });
    }
  }

  return res.status(400).json({ error: "Invalid POST body" });
}

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}