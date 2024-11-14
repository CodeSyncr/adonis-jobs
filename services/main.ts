/*
 * @brighthustle/adonis-jobs
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from "@adonisjs/core/services/app";
import { BullManager } from "../src/bull_manager.js";

let queue: BullManager;

/**
 * Returns a singleton instance of the Bull manager from the
 * container
 */
await app.booted(async () => {
  queue = await app.container.make("bull.manager");
});

export { queue as default };
