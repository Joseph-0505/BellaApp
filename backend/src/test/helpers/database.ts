import { prisma } from "../../lib/prisma";

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany(),
    prisma.cashRegister.deleteMany(),
    prisma.billing.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.clinicUser.deleteMany(),
    prisma.professional.deleteMany(),
    prisma.room.deleteMany(),
    prisma.service.deleteMany(),
    prisma.client.deleteMany(),
    prisma.inviteToken.deleteMany(),
    prisma.businessProfile.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.clinic.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
