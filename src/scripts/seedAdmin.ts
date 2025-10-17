import mongoose from "mongoose";
import env from "../config/env";
import { User } from "../modules/user/user.model";

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log("✅ Connected to MongoDB");

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });
    if (existingSuperAdmin) {
      console.log("⚠️  SuperAdmin user already exists");
      console.log(`Email: ${existingSuperAdmin.email}`);
      process.exit(0);
    }

    // Create SuperAdmin user (Platform Owner)
    const superAdmin = await User.create({
      email: "superadmin@teammanagement.com",
      password: "superadmin123", // Will be hashed by pre-save hook
      name: "Platform Super Administrator",
      role: "SuperAdmin",
      isActive: true,
      isOrganizationOwner: false,
      isOrganizationAdmin: false,
    });

    console.log("✅ SuperAdmin user created successfully:");
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: superadmin123`);
    console.log(`Role: ${superAdmin.role}`);
    console.log("\n⚠️  IMPORTANT: Change this password after first login!\n");

    // Create sample Admin user (Platform Administrator)
    const admin = await User.create({
      email: "admin@teammanagement.com",
      password: "admin123",
      name: "Platform Administrator",
      role: "Admin",
      isActive: true,
      isOrganizationOwner: false,
      isOrganizationAdmin: false,
    });

    console.log("✅ Sample Platform Admin created:");
    console.log(`Admin: ${admin.email} / admin123`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
