import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Add this to your .env file
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

export const query = (text: string, params?: any[]) => pool.query(text, params);