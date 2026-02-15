/**
 * Notifications repository – wraps notification-related API endpoints.
 */

import type {
  GetGetNotificationsData,
  GetGetNotificationsResponse,
} from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class NotificationsRepository extends BaseRepository {
  /**
   * List notifications.
   */
  async getNotifications(
    params?: GetGetNotificationsData["query"],
  ): Promise<GetGetNotificationsResponse> {
    return this.http.get<GetGetNotificationsResponse>(
      "/get_notifications",
      params as Record<string, unknown> | undefined,
    );
  }
}
