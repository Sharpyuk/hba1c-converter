// import { NextApiRequest, NextApiResponse } from "next";
// import { query } from "../../utils/db";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { method } = req;

//   switch (method) {
//     case "GET": {
//       const { userId } = req.query;

//       if (!userId) {
//         return res.status(400).json({ error: "User ID is required" });
//       }

//       try {
//         const result = await query("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
//         if (result.rows.length === 0) {
//           return res.status(404).json({ error: "Settings not found" });
//         }
//         return res.status(200).json(result.rows[0]);
//       } catch (error) {
//         return res.status(500).json({ error: "Database error" });
//       }
//     }

//     case "POST": {
//       const { userId, nightscoutAddress } = req.body;

//       if (!userId || !nightscoutAddress) {
//         return res.status(400).json({ error: "User ID and Nightscout address are required" });
//       }

//       try {
//         await query(
//           "INSERT INTO user_settings (user_id, nightscout_address) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET nightscout_address = $2",
//           [userId, nightscoutAddress]
//         );
//         return res.status(200).json({ message: "Settings saved successfully" });
//       } catch (error) {
//         return res.status(500).json({ error: "Database error" });
//       }
//     }

//     default:
//       res.setHeader("Allow", ["GET", "POST"]);
//       return res.status(405).end(`Method ${method} Not Allowed`);
//   }
// }

import { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../utils/db";
import { encrypt, decrypt } from "../../utils/encryption"; // <-- Import encryption helpers

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case "GET": {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      try {
        const result = await query("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Settings not found" });
        }
        const settings = result.rows[0];
        // Decrypt the API secret before returning (if present)
        let nightscoutApiSecret = null;
        if (settings.nightscout_api_secret) {
          try {
            nightscoutApiSecret = decrypt(settings.nightscout_api_secret);
          } catch {
            nightscoutApiSecret = null;
          }
        }
        return res.status(200).json({
          ...settings,
          nightscout_api_secret: nightscoutApiSecret,
        });
      } catch (error) {
        return res.status(500).json({ error: "Database error" });
      }
    }

    case "POST": {
      const { userId, nightscoutAddress, nightscoutApiSecret } = req.body;

      if (!userId || !nightscoutAddress || !nightscoutApiSecret) {
        return res.status(400).json({ error: "User ID, Nightscout address, and API secret are required" });
      }

      try {
        // Encrypt the API secret before saving
        const encryptedSecret = encrypt(nightscoutApiSecret);
        await query(
          `INSERT INTO user_settings (user_id, nightscout_address, nightscout_api_secret)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET nightscout_address = $2, nightscout_api_secret = $3`,
          [userId, nightscoutAddress, encryptedSecret]
        );
        return res.status(200).json({ message: "Settings saved successfully" });
      } catch (error: any) {
        console.error("Failed to save settings:", error);
        return res.status(500).json({ error: error.message || "Database error" });
}
    }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}