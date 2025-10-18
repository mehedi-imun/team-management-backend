import mongoose from "mongoose";
import env from "../config/env";

const resetDatabase = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log("✅ Connected to MongoDB");

    // Get all collections
    const collections = await mongoose.connection.db?.collections();
    
    if (!collections) {
      console.log("No collections found");
      process.exit(0);
    }

    console.log(`🗑️  Dropping ${collections.length} collections...`);

    // Drop all collections
    for (const collection of collections) {
      await collection.drop();
      console.log(`   ✓ Dropped: ${collection.collectionName}`);
    }

    console.log("\n✅ Database reset complete!");
    console.log("🔄 Run 'npm run seed:admin' to create new SuperAdmin\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
};

resetDatabase();
