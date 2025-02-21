import { Notice } from '../models/notice.model.js';
import { Student } from '../models/user.model.js';
import { createNotification } from './notification.controller.js';
import { deleteFile } from '../utils/cloudinaryConfig.js';

export const createNotice = async (request, reply) => {
  try {
    const faculty = request.user;
    const { title, content, targetAudience, priority, expiresAt } = request.body;

    const notice = await Notice.create({
      title,
      content,
      priority,
      targetAudience: JSON.parse(targetAudience),
      postedBy: faculty._id,
      expiresAt: new Date(expiresAt),
      ...(request.file && {
        attachment: {
          filepath: request.file.path,
          publicId: request.file.public_id,
          filename: request.file.originalname
        }
      })
    });

    // Notify relevant students
    const targetStudents = await Student.find({
      $or: targetAudience.map(target => ({
        course: target.course,
        semester: target.semester,
        isActive: true
      }))
    });

    const notificationPromises = targetStudents.map(student =>
      createNotification({
        recipient: student._id,
        recipientModel: 'Student',
        title: `${priority} Notice: ${title}`,
        message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        type: 'NOTICE',
        relatedId: notice._id
      })
    );

    await Promise.all(notificationPromises);

    return reply.code(201).send({
      success: true,
      message: 'Notice created successfully',
      notice
    });
  } catch (error) {
    if (request.file?.public_id) {
      await deleteFile(request.file.public_id).catch(console.error);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

export const getNotices = async (request, reply) => {
  try {
    const { course, semester } = request.user;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;

    const notices = await Notice.find({
      'targetAudience': {
        $elemMatch: {
          course,
          semester
        }
      },
      expiresAt: { $gt: new Date() }
    })
    .populate('postedBy', 'name')
    .sort({ priority: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    return reply.code(200).send({
      success: true,
      notices
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};