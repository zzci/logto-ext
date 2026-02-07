import logger from "./logger";

interface EnvConfig {
  LOGTO_ENDPOINT: string;
  LOGTO_M2M_APP_ID: string;
  LOGTO_M2M_APP_SECRET: string;
  LOGTO_SPA_APP_ID: string;
  APP_URL: string;
  LOGTO_WEBHOOK_SECRET?: string;
  API_KEY?: string;
  PORT: number;
}

function getEnvConfig(): EnvConfig {
  const required = ["LOGTO_ENDPOINT", "LOGTO_M2M_APP_ID", "LOGTO_M2M_APP_SECRET", "LOGTO_SPA_APP_ID", "APP_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  return {
    LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT!,
    LOGTO_M2M_APP_ID: process.env.LOGTO_M2M_APP_ID!,
    LOGTO_M2M_APP_SECRET: process.env.LOGTO_M2M_APP_SECRET!,
    LOGTO_SPA_APP_ID: process.env.LOGTO_SPA_APP_ID!,
    APP_URL: process.env.APP_URL!,
    LOGTO_WEBHOOK_SECRET: process.env.LOGTO_WEBHOOK_SECRET,
    API_KEY: process.env.API_KEY,
    PORT: parseInt(process.env.PORT || "3000", 10),
  };
}

export const env = getEnvConfig();
export default env;
