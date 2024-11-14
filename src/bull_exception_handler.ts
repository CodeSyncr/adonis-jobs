import { LoggerService } from "@adonisjs/core/types";
import { Job } from "bullmq";

/**
 * Bull exception handler serves as the base exception handler
 * to handle all exceptions occured during the BULL queue execution
 * lifecycle and makes appropriate response for them.
 */
export abstract class BullExceptionHandler {
  constructor(protected logger: LoggerService) {}

  async handle(error: any, job: Job) {
    if (typeof error.handle === "function") {
      return error.handle(error, job);
    }
    this.logger.error(error.message);
  }
}
