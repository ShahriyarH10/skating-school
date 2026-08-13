import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "School Admin";

if (!email || !password || password.length < 12) {
  throw new Error("Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD (minimum 12 characters)");
}

try {
  const hash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("The email exists but is not an admin account");
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hash, active: true, name },
    });
    console.log(`Updated administrator: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role: "admin",
        avatar: name.split(/\s+/).map((x) => x[0]).join("").toUpperCase(),
      },
    });
    console.log(`Created administrator: ${email}`);
  }
} finally {
  await prisma.$disconnect();
}
