import { createClient } from "redis";
import { env } from "./config";
import { ServiceLogger } from "./logger";
import {
  createNotificationJob,
  NotificationInput,
  NotificationJob,
  notificationJobSchema,
} from "./notification";

type StreamMessage = {
  id: string;
  message: Record<string, string>;
};

type StreamReadResult = Array<{
  name: string;
  messages: StreamMessage[];
}> | null;

export class NotificationQueue {
  constructor(
    private readonly client: Pick<
      ReturnType<typeof createClient>,
      | "xAck"
      | "xAdd"
      | "xAutoClaim"
      | "xDel"
      | "xGroupCreate"
      | "xLen"
      | "xReadGroup"
    >,
  ) {}

  async ensureConsumerGroup(): Promise<void> {
    try {
      await this.client.xGroupCreate(
        env.QUEUE_STREAM,
        env.QUEUE_GROUP,
        "0",
        { MKSTREAM: true },
      );
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
        throw error;
      }
    }
  }

  async enqueue(input: NotificationInput): Promise<NotificationJob> {
    const job = createNotificationJob(input);
    await this.enqueueJob(job);
    return job;
  }

  async enqueueJob(job: NotificationJob): Promise<string> {
    return this.client.xAdd(env.QUEUE_STREAM, "*", {
      job: JSON.stringify(job),
    });
  }

  async readNew(): Promise<StreamReadResult> {
    return this.client.xReadGroup(
      env.QUEUE_GROUP,
      env.QUEUE_CONSUMER_NAME,
      [{ key: env.QUEUE_STREAM, id: ">" }],
      { COUNT: env.QUEUE_BATCH_SIZE, BLOCK: env.QUEUE_BLOCK_MS },
    ) as Promise<StreamReadResult>;
  }

  async reclaimPending(): Promise<StreamReadResult> {
    const result = await this.client.xAutoClaim(
      env.QUEUE_STREAM,
      env.QUEUE_GROUP,
      env.QUEUE_CONSUMER_NAME,
      env.QUEUE_PENDING_IDLE_MS,
      "0-0",
      { COUNT: env.QUEUE_BATCH_SIZE },
    );

    if (result.messages.length === 0) return null;
    return [
      {
        name: env.QUEUE_STREAM,
        messages: result.messages as StreamMessage[],
      },
    ];
  }

  async acknowledge(messageId: string): Promise<void> {
    await this.client.xAck(env.QUEUE_STREAM, env.QUEUE_GROUP, messageId);
    await this.client.xDel(env.QUEUE_STREAM, messageId);
  }

  async retry(messageId: string, job: NotificationJob): Promise<void> {
    await this.enqueueJob({ ...job, attempt: job.attempt + 1 });
    await this.acknowledge(messageId);
  }

  async moveToDeadLetter(
    messageId: string,
    rawJob: string,
    error: unknown,
  ): Promise<void> {
    await this.client.xAdd(env.QUEUE_DEAD_LETTER_STREAM, "*", {
      job: rawJob,
      failedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    await this.acknowledge(messageId);
  }

  async stats(): Promise<{ queued: number; deadLetter: number }> {
    const [queued, deadLetter] = await Promise.all([
      this.client.xLen(env.QUEUE_STREAM),
      this.client.xLen(env.QUEUE_DEAD_LETTER_STREAM),
    ]);
    return { queued, deadLetter };
  }

  parse(message: StreamMessage): { job: NotificationJob; rawJob: string } {
    const rawJob = message.message.job;
    if (!rawJob) throw new Error("Queue message without job payload");
    return {
      rawJob,
      job: notificationJobSchema.parse(JSON.parse(rawJob)),
    };
  }
}

export type NotificationHandler = (job: NotificationJob) => Promise<void>;

export class NotificationWorker {
  private running = false;
  private loopPromise: Promise<void> | null = null;

  constructor(
    private readonly queue: NotificationQueue,
    private readonly handler: NotificationHandler,
    private readonly logger: ServiceLogger,
  ) {}

  async start(): Promise<void> {
    if (this.running) return;
    await this.queue.ensureConsumerGroup();
    this.running = true;
    this.loopPromise = this.runLoop();
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.loopPromise;
    this.loopPromise = null;
  }

  private async runLoop(): Promise<void> {
    while (this.running) {
      try {
        const streams =
          (await this.queue.reclaimPending()) ?? (await this.queue.readNew());
        if (!streams) continue;

        for (const stream of streams) {
          for (const message of stream.messages) {
            if (!this.running) return;
            await this.process(message);
          }
        }
      } catch (error) {
        if (this.running) {
          this.logger.error({ err: error, event: "notification.worker_error" }, "Notification worker error");
        }
      }
    }
  }

  private async process(message: StreamMessage): Promise<void> {
    let rawJob = message.message.job ?? "";
    let job: NotificationJob;

    try {
      const parsed = this.queue.parse(message);
      rawJob = parsed.rawJob;
      job = parsed.job;
    } catch (error) {
      this.logger.warn(
        { err: error, streamMessageId: message.id, event: "notification.invalid_job" },
        "Invalid notification moved to dead-letter queue",
      );
      await this.queue.moveToDeadLetter(message.id, rawJob, error);
      return;
    }

    try {
      await this.handler(job);
      await this.queue.acknowledge(message.id);
    } catch (error) {
      if (job.attempt < env.NOTIFICATION_MAX_ATTEMPTS) {
        this.logger.warn(
          { err: error, notificationId: job.id, attempt: job.attempt, event: "notification.retry" },
          "Notification will be retried",
        );
        await this.queue.retry(message.id, job);
        return;
      }

      this.logger.error(
        { err: error, notificationId: job.id, attempt: job.attempt, event: "notification.dead_letter" },
        "Notification moved to dead-letter queue",
      );
      await this.queue.moveToDeadLetter(message.id, rawJob, error);
    }
  }
}
