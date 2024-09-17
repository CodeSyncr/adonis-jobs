The package has been configured successfully. The Adonis Job configuration stored inside `config/bull.ts` file relies on the following environment variables, and hence we recommend validating them.

Open the `env.ts` file and paste the following code inside the `Env.rules` object.

### Variables for the Local driver

```ts
BULL_REDIS_HOST: Env.schema.string(),
BULL_CONNECTION: Env.schema.string(),
BULL_REDIS_PORT: Env.schema.number(),
BULL_REDIS_PASSWORD: Env.schema.string.optional(),
```