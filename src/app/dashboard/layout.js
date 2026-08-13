import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, phone: true },
  });

  if (!user) redirect("/login");

  // Get club info
  let club = null;
  if (user.role === "instructor") {
    const inst = await db.instructor.findUnique({
      where: { userId: user.id },
      include: { club: { select: { name: true, id: true } } },
    });
    club = inst?.club;
  } else if (user.role === "student") {
    const stu = await db.student.findUnique({
      where: { userId: user.id },
      include: { club: { select: { name: true, id: true } } },
    });
    club = stu?.club;
  }

  const serializedUser = {
    ...user,
    club: club?.name || "All Clubs",
    clubId: club?.id || null,
  };

  return (
    <AuthProvider initialUser={serializedUser}>
      <DashboardShell user={serializedUser}>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
