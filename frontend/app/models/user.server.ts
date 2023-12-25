import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User["email"], password: string, role: User["role"] = "DATA_OWNER") {
  const hashedPassword = await bcrypt.hash(password, 10);

  const userData = {
    email,
    role, // Include the role here
    password: {
      create: {
        hash: hashedPassword,
      },
    },
  };

  console.log("Data sent to Prisma create:", userData);

  return prisma.user.create({
    data: userData,
  });
}

export async function updateUserRole(userId: User["id"], newRole: User["role"]) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"],
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash,
  );

  if (!isValid) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
