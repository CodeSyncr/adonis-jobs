import { BaseCommand } from "@adonisjs/core/ace";
import { CommandOptions } from "@adonisjs/core/types/ace";

export default class Listen extends BaseCommand {
  static commandName = "bull:listen";
  static description = "Start the Bull listener";

  static options: CommandOptions = {
    loadApp: true,
    stayAlive: true,
  };

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const bull: any = await this.app.container.make("bull");

    bull.process();
  }
}
