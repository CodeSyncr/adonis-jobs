import type { ConnectionOptions, JobsOptions, WorkerOptions } from "bullmq";

type Config = {
  connection: ConnectionOptions;
  options: JobsOptions;
  workerOptions?: Omit<WorkerOptions, "connection" | "concurrency">;
};

export function defineConfig(config: Config) {
  return config;
}
