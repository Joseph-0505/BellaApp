import { randomUUID } from "node:crypto";
import { z } from "zod";

export const notificationInputSchema = z
  .object({
    channel: z.enum(["email", "log"]).default("log"),
    recipient: z.string().trim().min(1).max(320),
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(10_000),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, context) => {
    if (value.channel === "email" && !z.string().email().safeParse(value.recipient).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: "deve ser um e-mail valido para o canal email",
      });
    }
  });

export const notificationJobSchema = notificationInputSchema.and(
  z.object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    attempt: z.number().int().min(1),
  }),
);

export type NotificationInput = z.infer<typeof notificationInputSchema>;
export type NotificationJob = z.infer<typeof notificationJobSchema>;

export function createNotificationJob(input: NotificationInput): NotificationJob {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    attempt: 1,
    ...input,
  };
}
