![adonis-jobs](https://socialify.git.ci/CodeSyncr/adonis-jobs?description=1&descriptionEditable=Bull%20Job%20Wrapper%20for%20Adonis%20JS&forks=1&issues=1&language=1&name=1&owner=1&pattern=Signal&pulls=1&stargazers=1&theme=Light)

## What's this

`@brighthustle/adonis-jobs` is a powerful queue system designed specifically for AdonisJS applications, leveraging the reliability and scalability of BullMQ, a Redis-based queue for Node.js. Inspired from `@rocketseat/adonis-bull`, it offers enhanced functionality tailored to AdonisJS's ecosystem.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage](#usage)
   - [Job Dispatching](#job-dispatching)
   - [Job Creation](#job-creation)
   - [Job Lifecycle](#job-lifecycle)
4. [Advanced Features](#advanced-features)
   - [Job Attempts and Retries](#job-attempts-and-retries)
   - [Running the Queue Worker](#running-the-queue-worker)
5. [Dependencies](#dependencies)

## Installation <a id="installation"></a>

Begin by installing `@brighthustle/adonis-jobs` using npm:

```bash
npm install @brighthustle/adonis-jobs
```

## Configuration <a id="configuration"></a>

After installation, configure the package to adapt it to your AdonisJS project:

```bash
node ace configure @brighthustle/adonis-jobs
```

## Usage <a id="usage"></a>

### Job Dispatching <a id="job-dispatching"></a>

Utilize the `addTask` method provided by the `bull` provider to enqueue jobs.
Example:

> Please note that #app is an alia that was created by me, and isn't in adonis by default... So if you want to use it, you will need to add it in your tsconfig and package.json

```typescript
import app from '@adonisjs/core/services/app'
import queue from '@brighthustle/adonis-jobs/services/main'

```

### Job Creation <a id="job-creation"></a>

Generate new job classes using the `node ace make:job {job}` command.

Example:

```ts
// app/jobs/register_stripe_customer.ts
import { JobHandlerContract, Job } from '@brighthustle/adonis-jobs/types'

export type RegisterStripeCustomerPayload = {
  userId: string
}

export default class RegisterStripeCustomer
  implements JobHandlerContract<RegisterStripeCustomerPayload>
{
  public async handle(job: Job<RegisterStripeCustomerPayload>) {
    // Logic to register a Stripe customer
    const { userId } = job.data
    // Perform Stripe registration process
  }

  public async failed(job: Job<RegisterStripeCustomerPayload>) {
    // Logic to handle failed job attempts
    const { userId } = job.data
    // Send notification or log failure
  }
}
```

Register the new job into `start/jobs.ts`

```ts
// start/jobs.ts
const jobs: Record<string, Function> = {}

export { jobs }
```

### Job Lifecycle <a id="job-lifecycle"></a>

Define the `handle` method to execute job logic and the `failed` method to handle failed attempts.

## Advanced Features <a id="advanced-features"></a>

### Job Attempts and Retries <a id="job-attempts-and-retries"></a>

- Customize the retry setting for jobs, configurable in the `config/queue.ts` file.
- Adjust attempts and delays per job or globally.

### Running the Queue Worker <a id="running-the-queue-worker"></a>

Initiate the queue worker using the `node ace queue:listen` command.

- Specify queues or run the UI for monitoring and managing queues.

## Dependencies <a id="dependencies"></a>

- **@queuedash/api**: Provides API endpoints for monitoring and managing queues.
- **@trpc/server**: Starts QueueDash API server.
- **bullmq**: The core library for handling queues.

# Author

Kumar Yash
