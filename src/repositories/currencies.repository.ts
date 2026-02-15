/**
 * Currencies repository – thin passthrough with long-lived cache.
 */

import type { GetGetCurrenciesResponse } from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class CurrenciesRepository extends BaseRepository {
  /**
   * List supported currencies.
   * Results are cached for 24h by default.
   */
  async getCurrencies(): Promise<GetGetCurrenciesResponse> {
    return this.http.get<GetGetCurrenciesResponse>("/get_currencies");
  }
}
