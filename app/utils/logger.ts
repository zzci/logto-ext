import { createConsola, LogLevels, type LogType } from "consola";

export const logger = createConsola({
  level: LogLevels[(process.env.LOG_LEVEL as LogType) ?? "info"] ?? LogLevels.info,
  formatOptions: {
    date: true,
    colors: true,
  },
});

export default logger;
