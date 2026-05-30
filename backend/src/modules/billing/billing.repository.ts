import { ClinicPlan } from "@prisma/client";
import { prisma } from "../../lib/prisma";

type UpgradeablePlan = Extract<ClinicPlan, "INDIVIDUAL" | "TEAM">;

class BillingRepository {
  findClinicPlan(clinicId: string) {
    return prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        plan: true,
        trialEndsAt: true,
      },
    });
  }

  upgradePlan(clinicId: string, plan: UpgradeablePlan) {
    return prisma.$transaction(async (transaction) => {
      const clinic = await transaction.clinic.update({
        where: { id: clinicId },
        data: {
          plan,
          trialEndsAt: null,
        },
        select: {
          plan: true,
          trialEndsAt: true,
        },
      });

      const membershipUsers = await transaction.clinicUser.findMany({
        where: { clinicId },
        select: { userId: true },
      });

      const userIds = membershipUsers.map((membership) => membership.userId);

      if (userIds.length > 0) {
        await transaction.user.updateMany({
          where: {
            id: {
              in: userIds,
            },
          },
          data: {
            plan,
          },
        });
      }

      return clinic;
    });
  }
}

export const billingRepository = new BillingRepository();
