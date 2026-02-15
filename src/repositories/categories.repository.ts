/**
 * Categories repository – thin passthrough with long-lived cache.
 */

import type { GetGetCategoriesResponse } from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class CategoriesRepository extends BaseRepository {
  /**
   * List expense categories.
   * Results are cached for 24h by default.
   */
  async getCategories(): Promise<GetGetCategoriesResponse> {
    return this.http.get<GetGetCategoriesResponse>("/get_categories");
  }
}
