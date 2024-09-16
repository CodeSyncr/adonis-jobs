declare module '@ioc:Adonis/Core/Application' {
  import { BullManagerContract } from '@ioc:Adonis/Addons/Bull'

  export interface ContainerBindings {
    'Adonis/Addons/WhatsApp': BullManagerContract
  }
}
