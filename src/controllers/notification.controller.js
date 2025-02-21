import { Notification } from '../models/notification.model.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { sendNotification } from '../websocket/handlers.js';

export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Send real-time notification via WebSocket
    sendNotification(notification.recipient.toString(), {
      type: 'NEW_NOTIFICATION',
      data: notification
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (request, reply) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      recipient: request.user._id,
      recipientModel: request.user.role === 'student' ? 'Student' : 'Faculty'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Notification.countDocuments({
      recipient: request.user._id,
      recipientModel: request.user.role === 'student' ? 'Student' : 'Faculty'
    });

    return reply.code(200).send({
      success: true,
      notifications,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasMore: skip + notifications.length < total
      }
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

export const markNotificationRead = async (request, reply) => {
  try {
    const { id } = request.params;
    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: request.user._id
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new ErrorHandler("Notification not found", 404);
    }

    return reply.code(200).send({
      success: true,
      notification
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

export const markAllNotificationsRead = async (request, reply) => {
  try {
    await Notification.updateMany(
      {
        recipient: request.user._id,
        recipientModel: request.user.role === 'student' ? 'Student' : 'Faculty',
        read: false
      },
      { read: true }
    );

    return reply.code(200).send({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

export const deleteNotification = async (request, reply) => {
  try {
    const { id } = request.params;
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: request.user._id
    });

    if (!notification) {
      throw new ErrorHandler("Notification not found", 404);
    }

    return reply.code(200).send({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};