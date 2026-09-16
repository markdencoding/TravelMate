const notificationService = require('../services/notification.service');
const { success, error } = require('../utils/responseHelper');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getNotifications(userId);
    return success(res, 'Notifications retrieved successfully', notifications);
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    return success(res, 'Unread count retrieved successfully', { count });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const updated = await notificationService.markAsRead(notificationId, userId);
    
    if (!updated) {
      return error(res, 'Notification not found or access denied', null, 404);
    }
    
    return success(res, 'Notification marked as read', updated);
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);
    return success(res, 'All notifications marked as read', null);
  } catch (err) {
    next(err);
  }
};
