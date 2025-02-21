import { ErrorHandler } from "../utils/ErrorHandler.js";
import { Student } from "../models/user.model.js";
import { Faculty } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { generateTokens } from "../utils/jwt.js";

export const adminLogin = async (request, reply) => {
  try {
    const { email, password } = request.body;

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      throw new ErrorHandler("Invalid credentials", 401);
    }

    const isPasswordMatched = await admin.comparePassword(password);
    if (!isPasswordMatched) {
      throw new ErrorHandler("Invalid credentials", 401);
    }

    const { accessToken, refreshToken } = generateTokens(admin);

    return reply.code(200).send({
      success: true,
      accessToken,
      refreshToken
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const updateUserStatus = async (request, reply) => {
  try {
    const { userId, userType, isActive } = request.body;
    const Model = userType === 'student' ? Student : Faculty;

    const user = await Model.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );

    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    return reply.code(200).send({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const getPendingVerifications = async (request, reply) => {
  try {
    const students = await Student.find({ isActive: false });
    const faculty = await Faculty.find({ isActive: false });

    return reply.code(200).send({
      success: true,
      pendingVerifications: {
        students,
        faculty
      }
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const getUserDetails = async (request, reply) => {
  try {
    const { userId, userType } = request.params;
    const Model = userType === 'student' ? Student : Faculty;

    const user = await Model.findById(userId);
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    return reply.code(200).send({
      success: true,
      user
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};