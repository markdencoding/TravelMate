const db = require('../config/database');

class NotificationService {
  async getNotifications(userId) {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // Strip deterministic identity payload so it remains friendly in the UI
    result.rows.forEach(row => {
      if (row.message && row.message.includes('<!--ID:')) {
        row.message = row.message.split('<!--ID:')[0];
      }
    });
    
    return result.rows;
  }

  async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async markAsRead(notificationId, userId) {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  async markAllAsRead(userId) {
    await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return true;
  }

  /**
   * Internal method used by reminderService
   */
  async createNotification(userId, type, title, message) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, type, title, message]
    );
    return result.rows[0];
  }

  /**
   * Internal method used by reminderService for duplicate prevention
   */
  async checkExists(userId, identity) {
    const searchString = `%<!--ID:${identity}-->%`;
    const result = await db.query(
      `SELECT 1 FROM notifications WHERE user_id = $1 AND message LIKE $2 LIMIT 1`,
      [userId, searchString]
    );
    return result.rowCount > 0;
  }
}

module.exports = new NotificationService();
