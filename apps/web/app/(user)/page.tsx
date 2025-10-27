import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName = session?.user?.name || "User";
  const userId = session?.user?.id;
  console.log(userId);
  console.log(firstName);

  return <div className="flex flex-1 mt-9 flex-col">{firstName}</div>;
}
