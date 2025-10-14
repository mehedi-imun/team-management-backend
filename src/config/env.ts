import dotenv from "dotenv";

dotenv.config();

// Define the shape of the environment configuration
interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  NODE_ENV: "development" | "production" | "test";
  
}

// Function to load environment variables and validate their existence
const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVars: string[] = [
    "PORT",
    "DATABASE_URL",
    "NODE_ENV",
    "FRONTEND_URL",

  ];

  // Check if all required environment variables are set
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  // Return the validated environment variables
  return {
    PORT: process.env.PORT || "3000",
    DATABASE_URL: process.env.DATABASE_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
  };
};

// Call the function to load and validate the environment variables
const env = loadEnvVariables();

// Export the validated environment variables
export default env;