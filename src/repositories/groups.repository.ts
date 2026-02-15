/**
 * Groups repository – wraps group-related API endpoints.
 */

import type {
  GetGetGroupByIdResponse,
  GetGetGroupsResponse,
  PostAddUserToGroupData,
  PostAddUserToGroupResponse,
  PostCreateGroupData,
  PostCreateGroupResponse,
  PostDeleteGroupByIdResponse,
  PostRemoveUserFromGroupData,
  PostRemoveUserFromGroupResponse,
  PostUndeleteGroupByIdResponse,
} from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class GroupsRepository extends BaseRepository {
  /**
   * List current user's groups.
   */
  async getGroups(): Promise<GetGetGroupsResponse> {
    return this.http.get<GetGetGroupsResponse>("/get_groups");
  }

  /**
   * Get details about a group.
   */
  async getGroup(id: number): Promise<GetGetGroupByIdResponse> {
    return this.http.get<GetGetGroupByIdResponse>(`/get_group/${id}`);
  }

  /**
   * Create a group.
   */
  async createGroup(
    body: PostCreateGroupData["body"],
  ): Promise<PostCreateGroupResponse> {
    return this.http.post<PostCreateGroupResponse>(
      "/create_group",
      body,
      "/get_group",
    );
  }

  /**
   * Delete a group.
   */
  async deleteGroup(id: number): Promise<PostDeleteGroupByIdResponse> {
    return this.http.post<PostDeleteGroupByIdResponse>(
      `/delete_group/${id}`,
      undefined,
      "/get_group",
    );
  }

  /**
   * Restore a deleted group.
   */
  async undeleteGroup(id: number): Promise<PostUndeleteGroupByIdResponse> {
    return this.http.post<PostUndeleteGroupByIdResponse>(
      `/undelete_group/${id}`,
      undefined,
      "/get_group",
    );
  }

  /**
   * Add a user to a group.
   */
  async addUserToGroup(
    body: PostAddUserToGroupData["body"],
  ): Promise<PostAddUserToGroupResponse> {
    return this.http.post<PostAddUserToGroupResponse>(
      "/add_user_to_group",
      body,
      "/get_group",
    );
  }

  /**
   * Remove a user from a group.
   */
  async removeUserFromGroup(
    body: PostRemoveUserFromGroupData["body"],
  ): Promise<PostRemoveUserFromGroupResponse> {
    return this.http.post<PostRemoveUserFromGroupResponse>(
      "/remove_user_from_group",
      body,
      "/get_group",
    );
  }
}
