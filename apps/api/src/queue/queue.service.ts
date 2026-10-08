import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Queue } from "bullmq";
import { RedisService } from "../redis/redis.service";

export const MEDIA_PROCESSING_QUEUE = "media-processing";
export const NOTIFICATIONS_QUEUE = "notifications";

/**
 * BullMQ queues (F5.2). When REDIS_URL is unset the queues are not created
 * and jobs are dropped with a warning — workers run in a separate process.
 */
@Injectable()
export class QueueService implements OnApplicationShutdown {
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly redis: RedisService) {
    if (redis.client) {
      const connection = redis.client.duplicate();
      for (const name of [MEDIA_PROCESSING_QUEUE, NOTIFICATIONS_QUEUE]) {
        this.queues.set(
          name,
          new Queue(name, {
            connection,
            defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 },
          }),
        );
      }
    }
  }

  get enabled(): boolean {
    return this.queues.size > 0;
  }

  async addMediaProcessingJob(assetId: string): Promise<void> {
    await this.queues.get(MEDIA_PROCESSING_QUEUE)?.add("process", { assetId });
  }

  async addNotificationJob(userId: string, type: string): Promise<void> {
    await this.queues.get(NOTIFICATIONS_QUEUE)?.add("send", { userId, type });
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
