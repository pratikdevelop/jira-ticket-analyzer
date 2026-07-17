import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "alice@prisma.io",
    password: "$2a$12$9j6/mQw5MulmNSwawerj0u.lHamg/mv.8l2QsHrIvlD.372GK0dIG"
  },
  {
    name: "Bob",
    email: "bob@prisma.io",
    password: "$2a$12$9j6/mQw5MulmNSwawerj0u.lHamg/mv.8l2QsHrIvlD.372GK0dIG"
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();