import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const UserRoles = Object.freeze({
  STUDENT: "student",
  FACULITY: "faculity",
  ADMIN: "admin",
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: 4,
      required: [true, "Name must be atleast 4 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: function (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: "Invalid email format",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      validate: {
        validator: function (value) {
          const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passwordRegex.test(value);
        },
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      },
      select: false,
    },
    mobileNumber: {
      type: String,
      validate: {
        validator: function (value) {
          const mobileNumberRegex = /^[0-9]{10}$/;
          return mobileNumberRegex.test(value);
        },
        message: "Invalid mobile number format",
      },
      required: [true, "Mobile number is required"],
    },
    role: {
      type: String,
      enum: ["admin", "student", "faculty"],
      required: [true, "Role is required"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    verificationDocument: {
      type: String,
      required: [true, "Verification document is required"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// const resetToken = function () {
//   const resetToken = crypto.randomBytes(20).toString("hex");

//   this.resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

//   return resetToken;
// };

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

const studentSchema = new mongoose.Schema(
  {
    ...userSchema.obj,
    rollNumber: {
      type: Number,
      required: [true, "Roll number is required"],
      unique: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    session: {
      type: String,
      required: [true, "Session is required"],
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
    },
    role: {
      type: String,
      default: "student",
      enum: ["student"],
    },
  },
  { timestamps: true }
);

const facultySchema = new mongoose.Schema(
  {
    ...userSchema.obj,
    facultyId: {
      type: Number,
      required: [true, "Faculty ID is required"],
      unique: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    role: {
      type: String,
      default: "faculty",
      enum: ["faculty"],
    },
  },
  { timestamps: true }
);

studentSchema.methods = Object.create(userSchema.methods);
facultySchema.methods = Object.create(userSchema.methods);

export const Student = mongoose.model("Student", studentSchema);
export const Faculty = mongoose.model("Faculty", facultySchema);
