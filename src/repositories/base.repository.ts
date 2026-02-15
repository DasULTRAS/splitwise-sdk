/**
 * Base repository providing common HTTP operations.
 * All resource repositories extend this class.
 */

import type { HttpClient } from "../core/http-client.js";

export abstract class BaseRepository {
  constructor(protected readonly http: HttpClient) {}
}
