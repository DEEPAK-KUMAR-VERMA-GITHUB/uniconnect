import crypto from 'crypto';
import { Student, Faculty } from '../models/user.model.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/emailService.js';

export const forgotPassword = async (request, reply) => {
  try {
    const { email } = request.body;
    const user = await Student.findOne({ email }) || await Faculty.findOne({ email });

    if (!user) {
      throw new ErrorHandler('User not found with this email', 404);
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();
    await sendPasswordResetEmail(user, resetToken);

    return reply.code(200).send({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const resetPassword = async (request, reply) => {
  try {
    const { token, password } = request.body;
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await Student.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    }) || await Faculty.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ErrorHandler('Invalid or expired reset token', 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return reply.code(200).send({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};