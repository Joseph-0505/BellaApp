import { createClient } from "redis";
import { env } from "./config";
import { NotificationInput } from "./notification";
import { NotificationQueue } from "./queue";

export const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;
export const REMINDER_POLL_MS = 30_000;

const REMINDERS_KEY = `${env.QUEUE_STREAM}:reminders`;
const REMINDER_JOBS_KEY = `${REMINDERS_KEY}:jobs`;

type ReminderClient = Pick<
  ReturnType<typeof createClient>,
  "hDel" | "hGet" | "hSet" | "zAdd" | "zRangeByScore" | "zRem"
>;

// Lembretes ficam num sorted set (score = horário de envio), um por agendamento.
export class ReminderScheduler {
  constructor(
    private readonly client: ReminderClient,
    private readonly queue: Pick<NotificationQueue, "enqueue">,
  ) {}

  async schedule(appointmentId: string, notification: NotificationInput, dueAt: number): Promise<void> {
    await this.client.hSet(REMINDER_JOBS_KEY, appointmentId, JSON.stringify(notification));
    await this.client.zAdd(REMINDERS_KEY, { score: dueAt, value: appointmentId });
  }

  async cancel(appointmentId: string): Promise<void> {
    await this.client.zRem(REMINDERS_KEY, appointmentId);
    await this.client.hDel(REMINDER_JOBS_KEY, appointmentId);
  }

  async releaseDue(now = Date.now()): Promise<number> {
    const due = await this.client.zRangeByScore(REMINDERS_KEY, 0, now, {
      LIMIT: { offset: 0, count: env.QUEUE_BATCH_SIZE },
    });
    let released = 0;

    for (const appointmentId of due) {
      const raw = await this.client.hGet(REMINDER_JOBS_KEY, appointmentId);
      // zRem devolve 1 só para quem removeu: com mais de uma réplica, cada lembrete sai uma vez.
      if ((await this.client.zRem(REMINDERS_KEY, appointmentId)) === 0) continue;
      await this.client.hDel(REMINDER_JOBS_KEY, appointmentId);
      if (!raw) continue;
      // shortcut: se o processo cair entre o zRem e o enqueue, o lembrete se perde; mover com script Lua se isso importar.
      await this.queue.enqueue(JSON.parse(raw) as NotificationInput);
      released += 1;
    }

    return released;
  }
}
