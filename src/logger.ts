export enum LOG_LEVELS {
  ERROR = "error",
  INFO = "info",
  DEBUG = "debug",
}

export function getLogger(
  logger?: (message: string) => void,
  level: LOG_LEVELS = LOG_LEVELS.INFO
) {
  return (message: string) => {
    if (logger) {
      logger(`${level.toUpperCase()}: ${message}`);
    } else {
      console.log(`${level.toUpperCase()}: ${message}`);
    }
  };
}
