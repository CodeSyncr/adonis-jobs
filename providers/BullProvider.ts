import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { BullManager } from '../src/BullManager'
import { BullExceptionHandler } from '../src/BullExceptionHandler'
import { resolveHTTPResponse } from '@trpc/server/http'
import { Context, appRouter } from '@queuedash/api'

/**
 * Provider to bind bull to the container
 */
export default class BullProvider {
  constructor(protected app: ApplicationContract) {}

  public async register() {
    this.app.container.bind('Adonis/Addons/Bull/BullExceptionHandler', () => {
      return BullExceptionHandler
    })

    this.app.container.singleton('Adonis/Addons/Bull', () => {
      const app = this.app.container.use('Adonis/Core/Application')
      const config = this.app.container.use('Adonis/Core/Config').get('bull', {})
      const Logger = this.app.container.use('Adonis/Core/Logger')

      const jobs = require(app.startPath('jobs'))?.default || []

      return new BullManager(this.app.container, Logger, config, jobs)
    })

    this.app.container.alias('Adonis/Addons/Bull', 'Bull')
  }

  public async boot() {
    const router = await this.app.container.make('Adonis/Core/Route')
    const bullManager = this.app.container.use('Adonis/Addons/Bull')
    const queues = bullManager.queues

    router.jobs = (baseUrl: string = '/jobs') => {
      return router.group(() => {
        router.get(baseUrl, async ({ response }) => {
          response.header('Content-Type', 'text/html')

          return /* HTML */ ` <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>QueueDash App</title>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  window.__INITIAL_STATE__ = {
                    apiUrl: '${baseUrl}/trpc',
                    basename: '${baseUrl}',
                  }
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
            </html>`
        })

        router.any(`${baseUrl}/trpc/*`, async ({ request, response }) => {
          const path = request.url().split('/trpc/')[1]
          const url = new URL(request.completeUrl(true))

          const { body, status, headers } = await resolveHTTPResponse({
            createContext: async () => ({
              queues: Object.keys(queues).reduce((acc, displayName) => {
                acc.push({
                  queue: queues[displayName].bull,
                  displayName,
                  type: 'bullmq' as const,
                })

                return acc
              }, [] as Context['queues']),
            }),
            router: appRouter,
            path,
            req: {
              query: url.searchParams,
              method: request.method(),
              headers: request.headers(),
              body: request.body(),
            },
          })
          if (headers) {
            Object.keys(headers).forEach((key) => {
              const value = headers[key]
              if (value) response.header(key, value)
            })
          }
          response.status(status)
          response.send(body)
        })

        router.get(`${baseUrl}/*`, async ({ response }) => {
          response.header('Content-Type', 'text/html')
          return /* HTML */ `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>QueueDash App</title>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  window.__INITIAL_STATE__ = {
                    apiUrl: '${baseUrl}/trpc',
                    basename: '${baseUrl}',
                  }
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
            </html>`
        })
      })
    }
  }

  public async shutdown() {
    await this.app.container.use<'Adonis/Addons/Bull'>('Adonis/Addons/Bull').shutdown()
  }
}
