/*
 * @brighthustle/adonis-jobs
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { ApplicationService } from "@adonisjs/core/types";
import { resolveHTTPResponse } from "@trpc/server/http";
import { Context, appRouter } from "@queuedash/api";
import { defineConfig } from "../src/define_config.js";
import { BullManager } from "../src/bull_manager.js";
import { JobContract } from "../src/types/main.js";
import { RouteGroup } from "@adonisjs/core/http";
import { RuntimeException } from "@poppinss/utils";

/**
 * Provider to bind bull to the container
 */
export default class BullProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    const jobContracts: JobContract[] = [];

    const logger = await this.app.container.make("logger");
    const router = await this.app.container.make("router");
    const config = this.app.config.get<ReturnType<typeof defineConfig>>(
      "bull",
      {},
    );

    if (!config) {
      throw new RuntimeException(
        'Invalid config exported from "config/queue.ts" file. Make sure to use the defineConfig method',
      );
    }

    const jobModuleFile = await import(this.app.startPath("jobs.js"));
    const jobs = jobModuleFile?.default || [];

    for (let job of jobs) {
      const relativeFileName = this.app.makeURL(job).href;
      const jobModule = await import(relativeFileName);
      const JobClass = jobModule.default;
      const jobDefinition: JobContract = new JobClass();
      jobContracts.push(jobDefinition);
    }

    this.app.container.singleton(
      "queue.manager",
      () => new BullManager(logger, config, jobContracts),
    );

    const bullManager = await this.app.container.make("queue.manager");
    const queuesList = bullManager.queues;

    router.jobs = (baseUrl: string = "/jobs") => {
      return router.group(() => {
        router.get(baseUrl, async ({ response }) => {
          response.header("Content-Type", "text/html");

          return /* HTML */ ` <!doctype html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />
                <title>QueueDash App</title>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  window.__INITIAL_STATE__ = {
                    apiUrl: "${baseUrl}/trpc",
                    basename: "${baseUrl}",
                  };
                </script>
                <link
                  rel="stylesheet"
                  href="https://unpkg.com/@queuedash/ui@2.0.5/dist/styles.css"
                />
                <script
                  type="module"
                  src="https://unpkg.com/@queuedash/client@2.0.5/dist/main.mjs"
                ></script>
              </body>
            </html>`;
        });

        router.any(`${baseUrl}/trpc/*`, async ({ request, response }) => {
          const path = request.url().split("/trpc/")[1];
          const url = new URL(request.completeUrl(true));

          const { body, status, headers } = await resolveHTTPResponse({
            createContext: async () => ({
              queues: Object.keys(queuesList).reduce(
                (acc, displayName) => {
                  acc.push({
                    queue: queuesList[displayName].bull,
                    displayName,
                    type: "bullmq" as const,
                  });

                  return acc;
                },
                [] as Context["queues"],
              ),
            }),
            router: appRouter,
            path,
            req: {
              query: url.searchParams,
              method: request.method(),
              headers: request.headers(),
              body: request.body(),
            },
          });
          if (headers) {
            Object.keys(headers).forEach((key) => {
              const value = headers[key];
              if (value) response.header(key, value);
            });
          }
          response.status(status);
          response.send(body);
        });

        router.get(`${baseUrl}/*`, async ({ response }) => {
          response.header("Content-Type", "text/html");
          return /* HTML */ `<!doctype html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />
                <title>QueueDash App</title>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  window.__INITIAL_STATE__ = {
                    apiUrl: "${baseUrl}/trpc",
                    basename: "${baseUrl}",
                  };
                </script>
                <link
                  rel="stylesheet"
                  href="https://unpkg.com/@queuedash/ui@2.0.5/dist/styles.css"
                />
                <script
                  type="module"
                  src="https://unpkg.com/@queuedash/client@2.0.5/dist/main.mjs"
                ></script>
              </body>
            </html>`;
        });
      });
    };
  }
}

declare module "@adonisjs/core/http" {
  interface Router {
    jobs: (pattern?: string) => RouteGroup;
  }
}
