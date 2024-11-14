import { BullManager } from "../bull_manager.js";

declare module "@adonisjs/core/types" {
  export interface ContainerBindings {
    "queue.manager": BullManager;
  }
}
