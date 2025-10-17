import cron from "node-cron";
import {
  checkExpiredTrialsAndSuspend,
  checkTrialExpiryAndNotify,
} from "./notification.service";

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  // Run trial expiry check daily at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("🕒 Running trial expiry check...");
    try {
      await checkTrialExpiryAndNotify();
      console.log("✅ Trial expiry check completed");
    } catch (error) {
      console.error("❌ Trial expiry check failed:", error);
    }
  });

  // Run expired trial suspension daily at 10 AM
  cron.schedule("0 10 * * *", async () => {
    console.log("🕒 Running expired trial suspension...");
    try {
      await checkExpiredTrialsAndSuspend();
      console.log("✅ Expired trial suspension completed");
    } catch (error) {
      console.error("❌ Expired trial suspension failed:", error);
    }
  });

  console.log("✅ Cron jobs initialized");
};
