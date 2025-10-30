"use client";

import { dodopaymentsClient } from "@dodopayments/better-auth";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [dodopaymentsClient()],
  baseURL: process.env.BETTER_AUTH_URL,
});
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
