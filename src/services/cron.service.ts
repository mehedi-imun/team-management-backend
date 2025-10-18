import cron from "node-cron";
import { checkTrialExpiry } from "./trial.service";

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  // Run trial expiry check daily at 9 AM UTC
  // This checks for 7-day, 3-day, 1-day warnings and expired trials
  cron.schedule("0 9 * * *", async () => {
    console.log("🕒 [CRON] Running daily trial expiry check (9:00 AM UTC)...");
    try {
      await checkTrialExpiry();
      console.log("✅ [CRON] Trial expiry check completed successfully");
    } catch (error) {
      console.error("❌ [CRON] Trial expiry check failed:", error);
    }
  });

  console.log("✅ Cron jobs initialized:");
  console.log("  - Trial expiry check: Daily at 9:00 AM UTC");
};
