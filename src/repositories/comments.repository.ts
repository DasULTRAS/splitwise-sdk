/**
 * Comments repository – wraps comment-related API endpoints.
 */

import type {
  GetGetCommentsResponse,
  PostCreateCommentData,
  PostCreateCommentResponse,
  PostDeleteCommentByIdResponse,
} from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class CommentsRepository extends BaseRepository {
  /**
   * List comments on an expense.
   */
  async getComments(expenseId: number): Promise<GetGetCommentsResponse> {
    return this.http.get<GetGetCommentsResponse>("/get_comments", {
      expense_id: expenseId,
    });
  }

  /**
   * Create a comment on an expense.
   */
  async createComment(
    body: PostCreateCommentData["body"],
  ): Promise<PostCreateCommentResponse> {
    return this.http.post<PostCreateCommentResponse>(
      "/create_comment",
      body,
      "/get_comments",
    );
  }

  /**
   * Delete a comment.
   */
  async deleteComment(id: number): Promise<PostDeleteCommentByIdResponse> {
    return this.http.post<PostDeleteCommentByIdResponse>(
      `/delete_comment/${id}`,
      undefined,
      "/get_comments",
    );
  }
}
