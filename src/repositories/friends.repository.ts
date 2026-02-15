/**
 * Friends repository – wraps friend-related API endpoints.
 */

import type {
  GetGetFriendByIdResponse,
  GetGetFriendsResponse,
  PostCreateFriendData,
  PostCreateFriendResponse,
  PostCreateFriendsData,
  PostCreateFriendsResponse,
  PostDeleteFriendByIdResponse,
} from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class FriendsRepository extends BaseRepository {
  /**
   * List current user's friends.
   */
  async getFriends(): Promise<GetGetFriendsResponse> {
    return this.http.get<GetGetFriendsResponse>("/get_friends");
  }

  /**
   * Get details about a friend.
   */
  async getFriend(id: number): Promise<GetGetFriendByIdResponse> {
    return this.http.get<GetGetFriendByIdResponse>(`/get_friend/${id}`);
  }

  /**
   * Add a friend.
   */
  async createFriend(
    body: PostCreateFriendData["body"],
  ): Promise<PostCreateFriendResponse> {
    return this.http.post<PostCreateFriendResponse>(
      "/create_friend",
      body,
      "/get_friend",
    );
  }

  /**
   * Add multiple friends at once.
   */
  async createFriends(
    body: PostCreateFriendsData["body"],
  ): Promise<PostCreateFriendsResponse> {
    return this.http.post<PostCreateFriendsResponse>(
      "/create_friends",
      body,
      "/get_friend",
    );
  }

  /**
   * Delete a friend.
   */
  async deleteFriend(id: number): Promise<PostDeleteFriendByIdResponse> {
    return this.http.post<PostDeleteFriendByIdResponse>(
      `/delete_friend/${id}`,
      undefined,
      "/get_friend",
    );
  }
}
