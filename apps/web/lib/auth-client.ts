"use client";

import { dodopaymentsClient } from "@dodopayments/better-auth";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [dodopaymentsClient()],
  baseURL: "http://localhost:3000",
});
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
