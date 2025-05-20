import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Add the id property
      name?: string;
      email?: string;
      image?: string;
    };
  }

  interface User {
    id: string; // Add the id property
  }
}