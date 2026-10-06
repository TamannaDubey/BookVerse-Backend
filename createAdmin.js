require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("./sequelize");
const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await sequelize.authenticate();

    console.log("✅ Database connected");

    const email = "admin123@gmail.com";
    const password = "Admin@12345";

    const password_hash = await bcrypt.hash(password, 10);

    const existingAdmin = await Admin.findOne({
      where: { email }
    });

    if (existingAdmin) {
      await existingAdmin.update({
        password_hash,
        role: "admin"
      });

      console.log("✅ Admin password RESET successfully");
      console.log("Email:", email);
      return;
    }

    const admin = await Admin.create({
      email,
      role: "admin",
      password_hash
    });

    console.log("✅ Admin CREATED successfully");
    console.log("Email:", admin.email);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
  }
}

createAdmin();