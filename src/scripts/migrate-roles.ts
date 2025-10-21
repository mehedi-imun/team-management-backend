import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/team-management";

/**
 * Role Migration Script
 *
 * Migrates from old role system to new role system:
 *
 * OLD:
 * - role: "SuperAdmin" | "Admin" | "Member"
 * - isOrganizationOwner: boolean
 * - isOrganizationAdmin: boolean
 *
 * NEW:
 * - role: "SuperAdmin" | "Admin" | "OrgOwner" | "OrgAdmin" | "OrgMember"
 */

interface OldUser {
  _id: string;
  role: string;
  isOrganizationOwner?: boolean;
  isOrganizationAdmin?: boolean;
  email: string;
  name: string;
}

async function migrateRoles() {
  try {
    console.log("🚀 Starting role migration...\n");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection failed");
    }

    const usersCollection = db.collection("users");

    // Get current statistics
    const totalUsers = await usersCollection.countDocuments();
    const superAdmins = await usersCollection.countDocuments({
      role: "SuperAdmin",
    });
    const admins = await usersCollection.countDocuments({ role: "Admin" });
    const members = await usersCollection.countDocuments({ role: "Member" });
    const orgOwners = await usersCollection.countDocuments({
      role: "Member",
      isOrganizationOwner: true,
    });
    const orgAdmins = await usersCollection.countDocuments({
      role: "Member",
      isOrganizationAdmin: true,
    });
    const regularMembers = await usersCollection.countDocuments({
      role: "Member",
      isOrganizationOwner: { $ne: true },
      isOrganizationAdmin: { $ne: true },
    });

    console.log("📊 Current Database Statistics:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total Users: ${totalUsers}`);
    console.log(`SuperAdmins: ${superAdmins}`);
    console.log(`Admins: ${admins}`);
    console.log(`Members (total): ${members}`);
    console.log(`  └─ With isOrganizationOwner=true: ${orgOwners}`);
    console.log(`  └─ With isOrganizationAdmin=true: ${orgAdmins}`);
    console.log(`  └─ Regular members: ${regularMembers}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Confirm migration
    console.log("⚠️  This will update user roles in the database.");
    console.log("   Press Ctrl+C to cancel or wait 5 seconds to continue...\n");

    // Wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("🔄 Starting migration...\n");

    // 1. SuperAdmin and Admin - Remove flags
    console.log("Step 1/5: Cleaning SuperAdmin and Admin roles...");
    const step1 = await usersCollection.updateMany(
      { role: { $in: ["SuperAdmin", "Admin"] } },
      {
        $unset: {
          isOrganizationOwner: "",
          isOrganizationAdmin: "",
        },
      }
    );
    console.log(`✅ Updated ${step1.modifiedCount} platform admin users\n`);

    // 2. Members with isOrganizationOwner = true -> OrgOwner
    console.log("Step 2/5: Migrating organization owners...");
    const step2 = await usersCollection.updateMany(
      { role: "Member", isOrganizationOwner: true },
      {
        $set: { role: "OrgOwner" },
        $unset: {
          isOrganizationOwner: "",
          isOrganizationAdmin: "",
        },
      }
    );
    console.log(`✅ Migrated ${step2.modifiedCount} users to OrgOwner\n`);

    // 3. Members with isOrganizationAdmin = true -> OrgAdmin
    console.log("Step 3/5: Migrating organization admins...");
    const step3 = await usersCollection.updateMany(
      {
        role: "Member",
        isOrganizationAdmin: true,
        isOrganizationOwner: { $ne: true },
      },
      {
        $set: { role: "OrgAdmin" },
        $unset: {
          isOrganizationOwner: "",
          isOrganizationAdmin: "",
        },
      }
    );
    console.log(`✅ Migrated ${step3.modifiedCount} users to OrgAdmin\n`);

    // 4. Regular Members -> OrgMember
    console.log("Step 4/5: Migrating regular members...");
    const step4 = await usersCollection.updateMany(
      {
        role: "Member",
        $or: [
          { isOrganizationOwner: { $exists: false } },
          { isOrganizationOwner: false },
        ],
        $and: [
          {
            $or: [
              { isOrganizationAdmin: { $exists: false } },
              { isOrganizationAdmin: false },
            ],
          },
        ],
      },
      {
        $set: { role: "OrgMember" },
        $unset: {
          isOrganizationOwner: "",
          isOrganizationAdmin: "",
        },
      }
    );
    console.log(`✅ Migrated ${step4.modifiedCount} users to OrgMember\n`);

    // 5. Clean up any remaining fields
    console.log("Step 5/5: Cleaning up remaining fields...");
    const step5 = await usersCollection.updateMany(
      {
        $or: [
          { isOrganizationOwner: { $exists: true } },
          { isOrganizationAdmin: { $exists: true } },
        ],
      },
      {
        $unset: {
          isOrganizationOwner: "",
          isOrganizationAdmin: "",
        },
      }
    );
    console.log(`✅ Cleaned ${step5.modifiedCount} remaining records\n`);

    // Get new statistics
    console.log("📊 New Database Statistics:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const newSuperAdmins = await usersCollection.countDocuments({
      role: "SuperAdmin",
    });
    const newAdmins = await usersCollection.countDocuments({ role: "Admin" });
    const newOrgOwners = await usersCollection.countDocuments({
      role: "OrgOwner",
    });
    const newOrgAdmins = await usersCollection.countDocuments({
      role: "OrgAdmin",
    });
    const newOrgMembers = await usersCollection.countDocuments({
      role: "OrgMember",
    });
    const stillHaveFlags = await usersCollection.countDocuments({
      $or: [
        { isOrganizationOwner: { $exists: true } },
        { isOrganizationAdmin: { $exists: true } },
      ],
    });

    console.log(`Total Users: ${totalUsers}`);
    console.log(`SuperAdmins: ${newSuperAdmins}`);
    console.log(`Admins: ${newAdmins}`);
    console.log(`OrgOwners: ${newOrgOwners}`);
    console.log(`OrgAdmins: ${newOrgAdmins}`);
    console.log(`OrgMembers: ${newOrgMembers}`);
    console.log(`Users with old flags: ${stillHaveFlags}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Verify migration
    if (stillHaveFlags > 0) {
      console.log("⚠️  Warning: Some users still have old role flags!");
      const usersWithFlags = await usersCollection
        .find({
          $or: [
            { isOrganizationOwner: { $exists: true } },
            { isOrganizationAdmin: { $exists: true } },
          ],
        })
        .limit(10)
        .toArray();
      console.log("Sample users with flags:", usersWithFlags);
    } else {
      console.log("✅ All users successfully migrated!");
    }

    // Show sample users from each role
    console.log("\n📋 Sample Users by Role:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const roleTypes = [
      "SuperAdmin",
      "Admin",
      "OrgOwner",
      "OrgAdmin",
      "OrgMember",
    ];
    for (const roleType of roleTypes) {
      const sample = await usersCollection.findOne(
        { role: roleType },
        { projection: { email: 1, name: 1, role: 1, organizationId: 1 } }
      );
      if (sample) {
        console.log(`\n${roleType}:`);
        console.log(`  Email: ${sample.email}`);
        console.log(`  Name: ${sample.name}`);
        console.log(
          `  Organization ID: ${
            sample.organizationId || "N/A (Platform Admin)"
          }`
        );
      }
    }

    console.log("\n\n🎉 Migration completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log(
      "1. Update User model to remove isOrganizationOwner and isOrganizationAdmin fields"
    );
    console.log("2. Update User interface to use new role enum");
    console.log("3. Update frontend role mapping");
    console.log("4. Test all role-based features");
    console.log("5. Deploy new code\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateRoles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrateRoles;
