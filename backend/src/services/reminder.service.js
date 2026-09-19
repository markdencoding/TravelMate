const db = require('../config/database');
const notificationService = require('./notification.service');

class ReminderService {
  async generateReminders() {
    let generated = 0;
    let skipped = 0;

    try {
      // 1. Process 5-day Trip Reminders
      const trips5 = await db.query(`
        SELECT id, user_id, name, primary_destination, start_date 
        FROM trips 
        WHERE start_date = CURRENT_DATE + INTERVAL '5 days'
      `);
      for (const trip of trips5.rows) {
        const destText = trip.primary_destination ? ` to ${trip.primary_destination}` : '';
        const title = `Upcoming Trip: ${trip.name} (5 Days)`;
        const identity = `trip:${trip.id}:reminder:5d`;
        const exists = await notificationService.checkExists(trip.user_id, identity);
        if (!exists) {
          await notificationService.createNotification(
            trip.user_id,
            'trip',
            title,
            `Your trip "${trip.name}"${destText} starts in 5 days. Check your packing list and itinerary!<!--ID:${identity}-->`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      // 2. Process 3-day Trip Reminders
      const trips3 = await db.query(`
        SELECT id, user_id, name, primary_destination, start_date 
        FROM trips 
        WHERE start_date = CURRENT_DATE + INTERVAL '3 days'
      `);
      for (const trip of trips3.rows) {
        const destText = trip.primary_destination ? ` to ${trip.primary_destination}` : '';
        const title = `Upcoming Trip: ${trip.name} (3 Days)`;
        const identity = `trip:${trip.id}:reminder:3d`;
        const exists = await notificationService.checkExists(trip.user_id, identity);
        if (!exists) {
          await notificationService.createNotification(
            trip.user_id,
            'trip',
            title,
            `Your trip "${trip.name}"${destText} starts in 3 days. Getting excited?<!--ID:${identity}-->`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      // 3. Process 1-day Trip Reminders
      const trips1 = await db.query(`
        SELECT id, user_id, name, primary_destination, start_date 
        FROM trips 
        WHERE start_date = CURRENT_DATE + INTERVAL '1 day'
      `);
      for (const trip of trips1.rows) {
        const destText = trip.primary_destination ? ` to ${trip.primary_destination}` : '';
        const title = `Upcoming Trip: ${trip.name} (Tomorrow)`;
        const identity = `trip:${trip.id}:reminder:1d`;
        const exists = await notificationService.checkExists(trip.user_id, identity);
        if (!exists) {
          await notificationService.createNotification(
            trip.user_id,
            'trip',
            title,
            `Your trip "${trip.name}"${destText} starts tomorrow! Time for final preparations.<!--ID:${identity}-->`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      // 4. Process Trip-Day Reminders (Departure Day)
      const tripsToday = await db.query(`
        SELECT id, user_id, name, primary_destination, start_date 
        FROM trips 
        WHERE start_date = CURRENT_DATE
      `);
      for (const trip of tripsToday.rows) {
        const title = `Your trip starts today ✈️`;
        const identity = `trip:${trip.id}:reminder:today`;
        const exists = await notificationService.checkExists(trip.user_id, identity);
        if (!exists) {
          await notificationService.createNotification(
            trip.user_id,
            'trip',
            title,
            `Have an amazing adventure on "${trip.name}"! Today is departure day. Safe travels!<!--ID:${identity}-->`
          );
          generated++;
        } else {
          skipped++;
        }
      }

      // 5. Process 1-day Activity Reminders
      const activities = await db.query(`
        SELECT a.id, a.name, a.start_time, a.location, t.user_id, t.name as trip_name, d.date 
        FROM activities a
        JOIN itinerary_days d ON a.itinerary_day_id = d.id
        JOIN trips t ON d.trip_id = t.id
        WHERE d.date = CURRENT_DATE + INTERVAL '1 day'
      `);
      for (const activity of activities.rows) {
        const timeText = activity.start_time ? ` at ${activity.start_time.slice(0, 5)}` : '';
        const locText = activity.location ? ` at ${activity.location}` : '';
        const title = `Upcoming Activity: ${activity.name}`;
        const identity = `activity:${activity.id}:reminder:1d`;
        const exists = await notificationService.checkExists(activity.user_id, identity);
        if (!exists) {
          await notificationService.createNotification(
            activity.user_id,
            'reminder',
            title,
            `Your activity "${activity.name}" on ${activity.trip_name} is scheduled for tomorrow${timeText}${locText}.<!--ID:${identity}-->`
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
      return { generated, skipped, error: error.message };
    }
  }
}

module.exports = new ReminderService();
