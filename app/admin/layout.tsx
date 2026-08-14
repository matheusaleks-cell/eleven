import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // A própria página de login não deve exigir sessão (evita loop de redirecionamento).
  if (!pathname.includes("/admin/login")) {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      redirect("/admin/login");
    }
  }

  return <>{children}</>;
}
