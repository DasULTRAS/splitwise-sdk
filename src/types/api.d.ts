import { paths } from "./openapi-types";

// Users
export type GetCurrentUserResponse =
  paths["/get_current_user"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetUserResponse =
  paths["/get_user/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type UpdateUserRequest =
  paths["/update_user/{id}"]["post"]["requestBody"]["content"]["application/json"];
export type UpdateUserResponse =
  paths["/update_user/{id}"]["post"]["responses"]["200"]["content"]["application/json"];

// Groups
export type GetGroupsResponse =
  paths["/get_groups"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetGroupResponse =
  paths["/get_group/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type CreateGroupRequest =
  paths["/create_group"]["post"]["requestBody"]["content"]["application/json"];
export type CreateGroupResponse =
  paths["/create_group"]["post"]["responses"]["200"]["content"]["application/json"];
export type DeleteGroupResponse =
  paths["/delete_group/{id}"]["post"]["responses"]["200"]["content"]["application/json"];
export type UndeleteGroupResponse =
  paths["/undelete_group/{id}"]["post"]["responses"]["200"]["content"]["application/json"];
export type AddUserToGroupRequest =
  paths["/add_user_to_group"]["post"]["requestBody"]["content"]["application/json"];
export type AddUserToGroupResponse =
  paths["/add_user_to_group"]["post"]["responses"]["200"]["content"]["application/json"];
export type RemoveUserFromGroupResponse =
  paths["/remove_user_from_group"]["post"]["responses"]["200"]["content"]["application/json"];

// Friends
export type GetFriendsResponse =
  paths["/get_friends"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetFriendResponse =
  paths["/get_friend/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type CreateFriendRequest =
  paths["/create_friend"]["post"]["requestBody"]["content"]["application/json"];
export type CreateFriendResponse =
  paths["/create_friend"]["post"]["responses"]["200"]["content"]["application/json"];
export type CreateFriendsResponse =
  paths["/create_friends"]["post"]["responses"]["200"]["content"]["application/json"];
export type DeleteFriendResponse =
  paths["/delete_friend/{id}"]["post"]["responses"]["200"]["content"]["application/json"];

// Currencies
export type GetCurrenciesResponse =
  paths["/get_currencies"]["get"]["responses"]["200"]["content"]["application/json"];

// Expenses
export type GetExpenseResponse =
  paths["/get_expense/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type GetExpensesRequestParams =
  paths["/get_expenses"]["get"]["parameters"]["query"];
export type GetExpensesResponse =
  paths["/get_expenses"]["get"]["responses"]["200"]["content"]["application/json"];
export type CreateExpenseRequest =
  paths["/create_expense"]["post"]["requestBody"]["content"]["application/json"];
export type CreateExpenseResponse =
  paths["/create_expense"]["post"]["responses"]["200"]["content"]["application/json"];
export type UpdateExpenseRequest =
  paths["/update_expense/{id}"]["post"]["requestBody"]["content"]["application/json"];
export type UpdateExpenseResponse =
  paths["/update_expense/{id}"]["post"]["responses"]["200"]["content"]["application/json"];
export type DeleteExpenseResponse =
  paths["/delete_expense/{id}"]["post"]["responses"]["200"]["content"]["application/json"];
export type UndeleteExpenseResponse =
  paths["/undelete_expense/{id}"]["post"]["responses"]["200"]["content"]["application/json"];

// Comments
export type GetCommentsResponse =
  paths["/get_comments"]["get"]["responses"]["200"]["content"]["application/json"];
export type CreateCommentRequest =
  paths["/create_comment"]["post"]["requestBody"]["content"]["application/json"];
export type CreateCommentResponse =
  paths["/create_comment"]["post"]["responses"]["200"]["content"]["application/json"];
export type DeleteCommentResponse =
  paths["/delete_comment/{id}"]["post"]["responses"]["200"]["content"]["application/json"];

// Notifications
export type GetNotificationsResponse =
  paths["/get_notifications"]["get"]["responses"]["200"]["content"]["application/json"];

// Categories
export type GetCategoriesResponse =
  paths["/get_categories"]["get"]["responses"]["200"]["content"]["application/json"];
