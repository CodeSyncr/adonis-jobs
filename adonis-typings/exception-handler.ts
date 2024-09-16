/**
 * The binding for the given module is defined inside `providers/AppProvider.ts`
 * file.
 */
declare module '@ioc:Adonis/Addons/Bull/BullExceptionHandler' {
  import { LoggerContract } from '@ioc:Adonis/Core/Logger'
  import { Job } from 'bullmq'

  export default abstract class BullExceptionHandler {
    constructor(logger: LoggerContract)
    protected logger: LoggerContract
    public handle(error: any, ctx: Job): Promise<any>
  }
}
