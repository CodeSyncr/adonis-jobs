declare module '@ioc:Adonis/Core/Application' {
  import { BullManagerContract } from '@ioc:Adonis/Addons/Bull'
  export interface ContainerBindings {
    'Adonis/Addons/Bull': BullManagerContract
  }
}

declare module '@ioc:Adonis/Core/Route' {
  interface RouterContract {
    jobs: (pattern?: string) => RouteGroupContract
  }
}
