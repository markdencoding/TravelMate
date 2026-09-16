const db = require('../config/database');
const notificationService = require('./notification.service');

class ReminderService {
  async generateReminders() {
    let generated = 0;
    let skipped = 0;

    try {
      // 1. Process 5-day Trip Reminders
      const trips5 = await db.query(`
        SELECT id, user_id, name 
        FROM trips 
        WHERE start_date = CURRENT_DATE + INTERVAL '5 days'
      `);
      for (const trip of trips5.rows) {
        const title = `Upcoming Trip: ${trip.name} (5 Days)`;
        const exists = await notificationService.checkExists(trip.user_id, title);
        if (!exists) {
          await notificationService.createNotification(
            trip.user_id,
            'trip',
            title,
            `Your trip to ${trip.name} starts in 5 days.`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      // 2. Process 3-day Trip Reminders
      const trips3 = await db.query(`
        SELECT id, user_id, name 
        FROM trips 
        WHERE start_date = CURRENT_DATE + INTERVAL '3 days'
      `);
      for (const trip of trips3.rows) {
        const title = `Upcoming Trip: ${trip.name} (3 Days)`;
        const exists = await notificationService.checkExists(trip.user_id, title);
        if (!exists) {
          await notificationService.createNotification(
            trip.user_id,
            'trip',
            title,
            `Your trip to ${trip.name} starts in 3 days.`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      // 3. Process 1-day Activity Reminders
      const activities = await db.query(`
        SELECT a.id, a.name, t.user_id, d.date 
        FROM activities a
        JOIN itinerary_days d ON a.itinerary_day_id = d.id
        JOIN trips t ON d.trip_id = t.id
        WHERE d.date = CURRENT_DATE + INTERVAL '1 day'
      `);
      for (const activity of activities.rows) {
        const title = `Upcoming Activity: ${activity.name}`;
        const exists = await notificationService.checkExists(activity.user_id, title);
        if (!exists) {
          await notificationService.createNotification(
            activity.user_id,
            'reminder',
            title,
            `Your activity "${activity.name}" is scheduled for tomorrow.`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      console.log(`[ReminderService] Generated: ${generated} | Skipped (Duplicates): ${skipped}`);
      return { generated, skipped };
    } catch (error) {
      console.error('[ReminderService] Error generating reminders:', error);
      // Let it fail silently outwards so we don't crash the server
    }
  }
}

module.exports = new ReminderService();
