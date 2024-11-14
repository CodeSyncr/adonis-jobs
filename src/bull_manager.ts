import { LoggerService } from "@adonisjs/core/types";
import {
  Queue,
  JobsOptions,
  Job as BullJob,
  Worker,
  WorkerOptions,
  Processor,
  WorkerListener,
  QueueOptions,
} from "bullmq";
import {
  BullManagerContract,
  EventListener,
  JobContract,
  QueueContract,
} from "./types/main.js";
import { defineConfig } from "./define_config.js";

export class BullManager implements BullManagerContract {
  #logger: LoggerService;
  #config: ReturnType<typeof defineConfig>;
  #jobs: JobContract[];

  constructor(
    logger: LoggerService,
    config: ReturnType<typeof defineConfig>,
    jobs: JobContract[],
  ) {
    this.#config = config;
    this.#logger = logger;
    this.#jobs = jobs;
  }

  private _queues!: { [key: string]: QueueContract };
  private _shutdowns: (() => Promise<any>)[] = [];

  get queues(): { [key: string]: QueueContract } {
    this._queues = this.#jobs.reduce(
      (queues: any, jobDefinition: JobContract) => {
        const queueConfig: QueueOptions = {
          connection: this.#config.connection,
          defaultJobOptions: this.#config.options,
          ...jobDefinition.queueOptions,
        };

        const jobListeners = this._getEventListener(jobDefinition);
        queues[jobDefinition.key] = Object.freeze({
          bull: new Queue(jobDefinition.key, queueConfig),
          ...jobDefinition,
          instance: jobDefinition,
          listeners: jobListeners,
          boot: jobDefinition.boot,
        });

        return queues;
      },
      {},
    );
    return this._queues;
  }

  private _getEventListener(job: JobContract): EventListener[] {
    const jobListeners = Object.getOwnPropertyNames(
      Object.getPrototypeOf(job),
    ).reduce((events, method: string) => {
      if (method.startsWith("on")) {
        const eventName = method
          .replace(/^on(\w)/, (_, group) => group.toLowerCase())
          .replace(/([A-Z]+)/, (_, group) => ` ${group.toLowerCase()}`);

        events.push({ eventName, method });
      }

      return events;
    }, [] as EventListener[]);

    return jobListeners;
  }

  getByKey(key: string): QueueContract {
    return this.queues[key];
  }

  add<T>(
    key: string,
    data: T,
    jobOptions?: JobsOptions,
  ): Promise<BullJob<any, any>> {
    return this.getByKey(key).bull.add(key, data, jobOptions);
  }

  schedule<T = any>(
    key: string,
    data: T,
    date: number | Date,
    options?: JobsOptions,
  ) {
    const delay = typeof date === "number" ? date : date.getTime() - Date.now();

    if (delay <= 0) {
      throw new Error("Invalid schedule time");
    }

    return this.add(key, data, { ...options, delay });
  }

  async remove(key: string, jobId: string): Promise<void> {
    const job = await this.getByKey(key).bull.getJob(jobId);
    return job?.remove();
  }

  process() {
    console.log("called process");
    this.#logger.info("Queue processing started");

    const shutdowns = Object.keys(this.queues).map((key) => {
      const jobDefinition = this.getByKey(key);

      if (typeof jobDefinition.boot !== "undefined") {
        jobDefinition.boot(jobDefinition.bull);
      }

      const workerOptions: WorkerOptions = {
        concurrency: jobDefinition.concurrency ?? 1,
        connection: this.#config.connection,
        ...jobDefinition.workerOptions,
      };

      const processor: Processor = async (job) => {
        try {
          return await jobDefinition.instance.handle(job);
        } catch (error) {
          // await this.handleException(error, job);
          return Promise.reject(error);
        }
      };

      const worker = new Worker(key, processor, workerOptions);

      jobDefinition.listeners.forEach(function (item: {
        eventName: string;
        method: string | number;
      }) {
        const methodName = item.method as keyof JobContract;
        worker.on(
          item.eventName as keyof WorkerListener<any, any, any>,
          (jobDefinition.instance[methodName] as Function).bind(
            jobDefinition.instance,
          ),
        );
      });

      const shutdown = () =>
        Promise.all([jobDefinition.bull.close(), worker.close()]);

      return shutdown;
    });

    this._shutdowns = [...this._shutdowns, ...shutdowns];

    return this;
  }

  // private async handleException(error: any, job: BullJob<any, any, string>) {
  //   try {
  //     const resolver = this.container.getResolver(
  //       undefined,
  //       "exceptions",
  //       "App/Exceptions",
  //     );

  //     const resolvedPayload = resolver.resolve("BullHandler.handle");

  //     await resolver.call(resolvedPayload, undefined, [error, job]);
  //   } catch (err) {
  //     this.Logger.error(`name=${job.name} id=${job.id}`);
  //   }
  // }

  async shutdown() {
    await Promise.all(this._shutdowns.map((shutdown) => shutdown()));
  }
}
