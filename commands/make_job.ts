import { args, BaseCommand, flags } from "@adonisjs/core/ace";
import { stubsRoot } from "../index.js";
import stringHelpers from "@adonisjs/core/helpers/string";
import { CommandOptions } from "@adonisjs/core/types/ace";
import { promises as fs } from "node:fs";
import { join } from "node:path";

export default class MakeJob extends BaseCommand {
  static commandName = "make:job";
  static description = "Make a new Bull job";
  static options: CommandOptions = {
    startApp: false,
    allowUnknownFlags: false,
    staysAlive: false,
  };

  /**
   * The name of the job file.
   */
  @args.string({ description: "Name of the job class" })
  declare name: string;

  /**
   * The priority of the job file.
   */
  @flags.number({ description: "Priority of the job" })
  declare priority: number;

  /**
   * Execute command
   */
  async run(): Promise<void> {
    await this.generate();
  }

  private async generate() {
    const codemods = await this.createCodemods();

    codemods.makeUsingStub(stubsRoot, "jobs/job.stub", {
      filename: stringHelpers.snakeCase(this.name),
      className: stringHelpers.pascalCase(this.name),
      priority: this.priority,
    });

    // Path to the jobs.js file
    const jobsFilePath = join(process.cwd(), "start", "jobs.ts");

    // Name of the new job file
    const jobFileName = stringHelpers.snakeCase(this.name);

    // Import jobs array, add the new job file, and write back
    const jobPath = `app/jobs/${jobFileName}.js`;
    const jobsContent = await fs.readFile(jobsFilePath, "utf-8");

    // Insert new job path in the jobs array
    const newJobsContent = jobsContent.replace(
      /export\s+default\s+\[\s*([\s\S]*?)\]/m,
      (_, jobsList) =>
        `export default [\n  ${jobsList.trim()},\n  '${jobPath}'\n]`,
    );

    await fs.writeFile(jobsFilePath, newJobsContent);
    this.logger.success(`Added ${jobPath} to jobs array`);
  }
}
