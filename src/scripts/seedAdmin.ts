import mongoose from "mongoose";
import env from "../config/env";
import { User } from "../modules/user/user.model";

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      console.log(`Email: ${existingAdmin.email}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: "admin@teammanagement.com",
      password: "admin123", // Will be hashed by pre-save hook
      name: "System Administrator",
      role: "Admin",
      isActive: true,
    });

    console.log("✅ Admin user created successfully:");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: admin123`);
    console.log(`Role: ${admin.role}`);
    console.log("\n⚠️  IMPORTANT: Change this password after first login!\n");

    // Create sample manager and director
    const manager = await User.create({
      email: "manager@teammanagement.com",
      password: "manager123",
      name: "Sample Manager",
      role: "Manager",
      isActive: true,
    });

    const director = await User.create({
      email: "director@teammanagement.com",
      password: "director123",
      name: "Sample Director",
      role: "Director",
      isActive: true,
    });

    console.log("✅ Sample users created:");
    console.log(`Manager: ${manager.email} / manager123`);
    console.log(`Director: ${director.email} / director123`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
