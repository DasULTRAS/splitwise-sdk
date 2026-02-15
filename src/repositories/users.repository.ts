/**
 * Users repository – thin passthrough to HTTP client.
 */

import type {
  GetGetCurrentUserResponse,
  GetGetUserByIdResponse,
  PostUpdateUserByIdData,
  PostUpdateUserByIdResponse,
} from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class UsersRepository extends BaseRepository {
  /**
   * Get information about the current user.
   */
  async getCurrentUser(): Promise<GetGetCurrentUserResponse> {
    return this.http.get<GetGetCurrentUserResponse>("/get_current_user");
  }

  /**
   * Get information about another user.
   */
  async getUser(id: number): Promise<GetGetUserByIdResponse> {
    return this.http.get<GetGetUserByIdResponse>(`/get_user/${id}`);
  }

  /**
   * Update a user.
   */
  async updateUser(
    id: number,
    body: PostUpdateUserByIdData["body"],
  ): Promise<PostUpdateUserByIdResponse> {
    return this.http.post<PostUpdateUserByIdResponse>(
      `/update_user/${id}`,
      body,
      ["/get_user", "/get_current_user"],
    );
  }
}
