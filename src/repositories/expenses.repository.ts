/**
 * Expenses repository – wraps expense-related API endpoints.
 */

import type {
  GetGetExpenseByIdResponse,
  GetGetExpensesData,
  GetGetExpensesResponse,
  PostCreateExpenseData,
  PostCreateExpenseResponse,
  PostDeleteExpenseByIdResponse,
  PostUndeleteExpenseByIdResponse,
  PostUpdateExpenseByIdData,
  PostUpdateExpenseByIdResponse,
} from "../generated/types.gen.js";
import { BaseRepository } from "./base.repository.js";

export class ExpensesRepository extends BaseRepository {
  /**
   * Get details about an expense.
   */
  async getExpense(id: number): Promise<GetGetExpenseByIdResponse> {
    return this.http.get<GetGetExpenseByIdResponse>(`/get_expense/${id}`);
  }

  /**
   * List expenses with optional filters.
   */
  async getExpenses(
    params?: GetGetExpensesData["query"],
  ): Promise<GetGetExpensesResponse> {
    return this.http.get<GetGetExpensesResponse>(
      "/get_expenses",
      params as Record<string, unknown> | undefined,
    );
  }

  /**
   * Create an expense.
   */
  async createExpense(
    body: PostCreateExpenseData["body"],
  ): Promise<PostCreateExpenseResponse> {
    return this.http.post<PostCreateExpenseResponse>(
      "/create_expense",
      body,
      "/get_expense",
    );
  }

  /**
   * Update an expense.
   */
  async updateExpense(
    id: number,
    body: PostUpdateExpenseByIdData["body"],
  ): Promise<PostUpdateExpenseByIdResponse> {
    return this.http.post<PostUpdateExpenseByIdResponse>(
      `/update_expense/${id}`,
      body,
      "/get_expense",
    );
  }

  /**
   * Delete an expense.
   */
  async deleteExpense(id: number): Promise<PostDeleteExpenseByIdResponse> {
    return this.http.post<PostDeleteExpenseByIdResponse>(
      `/delete_expense/${id}`,
      undefined,
      "/get_expense",
    );
  }

  /**
   * Restore a deleted expense.
   */
  async undeleteExpense(id: number): Promise<PostUndeleteExpenseByIdResponse> {
    return this.http.post<PostUndeleteExpenseByIdResponse>(
      `/undelete_expense/${id}`,
      undefined,
      "/get_expense",
    );
  }
}
