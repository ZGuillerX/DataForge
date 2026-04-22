import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@dataforge.dev" },
    update: {},
    create: {
      email: "demo@dataforge.dev",
      passwordHash,
      name: "Demo User",
    },
  });

  console.log(`✅ Seed completed. Demo user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
