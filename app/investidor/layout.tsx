import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "INVESTOR") {
    redirect("/login");
  }

  return <>{children}</>;
}
