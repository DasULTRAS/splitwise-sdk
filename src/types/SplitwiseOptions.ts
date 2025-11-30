export default interface SplitwiseOptions {
  consumerKey?: string;
  consumerSecret?: string;
  accessToken?: string;
  logger?: (message: string) => void;
  logLevel?: "info" | "error";
}
