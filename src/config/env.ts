import dotenv from "dotenv";

dotenv.config();

// Define the shape of the environment configuration
interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  NODE_ENV: "development" | "production" | "test";

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // Redis
  REDIS_URL: string;

  // Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  EMAIL_FROM: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID: string;
  STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID: string;
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: string;
  STRIPE_BUSINESS_ANNUAL_PRICE_ID: string;
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: string;
  STRIPE_ENTERPRISE_ANNUAL_PRICE_ID: string;
}

// Function to load environment variables and validate their existence
const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVars: string[] = [
    "PORT",
    "DATABASE_URL",
    "NODE_ENV",
    "FRONTEND_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  // Check if all required environment variables are set
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  // Helper function to clean environment variables (remove quotes and trim)
  const cleanEnv = (value: string | undefined): string => {
    if (!value) return "";
    return value.trim().replace(/^["']|["']$/g, "");
  };

  // Return the validated environment variables
  return {
    PORT: cleanEnv(process.env.PORT) || "3000",
    DATABASE_URL: cleanEnv(process.env.DATABASE_URL)!,
    FRONTEND_URL: cleanEnv(process.env.FRONTEND_URL)!,
    NODE_ENV: cleanEnv(process.env.NODE_ENV) as
      | "development"
      | "production"
      | "test",

    // JWT
    JWT_SECRET: cleanEnv(process.env.JWT_SECRET)!,
    JWT_EXPIRES_IN: cleanEnv(process.env.JWT_EXPIRES_IN) || "15m",
    JWT_REFRESH_SECRET: cleanEnv(process.env.JWT_REFRESH_SECRET)!,
    JWT_REFRESH_EXPIRES_IN:
      cleanEnv(process.env.JWT_REFRESH_EXPIRES_IN) || "7d",

    // Redis
    REDIS_URL: cleanEnv(process.env.REDIS_URL) || "redis://localhost:6379",

    // Email
    SMTP_HOST: cleanEnv(process.env.SMTP_HOST) || "smtp.gmail.com",
    SMTP_PORT: parseInt(cleanEnv(process.env.SMTP_PORT) || "587"),
    SMTP_USER: cleanEnv(process.env.SMTP_USER) || "",
    SMTP_PASSWORD: cleanEnv(process.env.SMTP_PASSWORD) || "",
    EMAIL_FROM:
      cleanEnv(process.env.EMAIL_FROM) || "noreply@teammanagement.com",

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(
      cleanEnv(process.env.RATE_LIMIT_WINDOW_MS) || "900000"
    ),
    RATE_LIMIT_MAX_REQUESTS: parseInt(
      cleanEnv(process.env.RATE_LIMIT_MAX_REQUESTS) || "100"
    ),

    // Stripe
    STRIPE_SECRET_KEY: cleanEnv(process.env.STRIPE_SECRET_KEY) || "",
    STRIPE_WEBHOOK_SECRET: cleanEnv(process.env.STRIPE_WEBHOOK_SECRET) || "",
    STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID:
      cleanEnv(process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID) || "",
    STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID:
      cleanEnv(process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID) || "",
    STRIPE_BUSINESS_MONTHLY_PRICE_ID:
      cleanEnv(process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID) || "",
    STRIPE_BUSINESS_ANNUAL_PRICE_ID:
      cleanEnv(process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID) || "",
    STRIPE_ENTERPRISE_MONTHLY_PRICE_ID:
      cleanEnv(process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID) || "",
    STRIPE_ENTERPRISE_ANNUAL_PRICE_ID:
      cleanEnv(process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID) || "",
  };
};

// Call the function to load and validate the environment variables
const env = loadEnvVariables();

// Export the validated environment variables
export default env;
