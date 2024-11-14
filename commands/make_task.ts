import { BaseCommand, args } from "@adonisjs/core/ace";
import { CommandOptions } from "@adonisjs/core/types/ace";
import { stubsRoot } from "../index.js";
import stringHelpers from "@adonisjs/core/helpers/string";
import { promises as fs } from "node:fs";
import { join } from "node:path";

export default class JobsMake extends BaseCommand {
  static commandName = "make:task";
  static description = "Make a new task class";

  static options: CommandOptions = {
    startApp: false,
    allowUnknownFlags: false,
    staysAlive: false,
  };

  @args.string({ description: "Name of class" })
  declare name: string;

  async run() {
    await this.generate();
  }

  private async generate() {
    const codemods = await this.createCodemods();
    const taskFileName = stringHelpers.snakeCase(this.name);
    const taskClassName = stringHelpers.pascalCase(this.name);

    codemods.makeUsingStub(stubsRoot, "jobs/tasks/task.stub", {
      filename: taskFileName,
      className: taskClassName,
    });

    // Path to the task/index.js file
    const tasksFilePath = join(process.cwd(), "app/jobs/tasks", "index.ts");

    // Read the current content of tasks.js
    const tasksContent = await fs.readFile(tasksFilePath, "utf-8");

    // Add the new task to the export object
    const newTasksContent = tasksContent.replace(
      /export\s+default\s+{\s*([\s\S]*?)\s*}/m,
      (_, tasksList) =>
        `export default {\n  ${tasksList.trim()}\n  ${taskClassName}: '${taskClassName}',\n}`,
    );

    // Write the updated content back to tasks.js
    await fs.writeFile(tasksFilePath, newTasksContent);
    this.logger.success(`Added ${taskClassName} to tasks`);
  }
}
