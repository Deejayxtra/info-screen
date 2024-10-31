import { openDb } from "../db/database.js";


// Helper function to get the current ongoing race session ID
export const getCurrentRace = async () => {
  const db = await openDb();
  try {
    // Assuming there is a 'race_sessions' table where the ongoing race has an active status
    const race = await db.get(`
        SELECT id, start_time FROM race_sessions
        WHERE status = 'Active' LIMIT 1
    `);
    if (!race) {
      return null;
    }

    const drivers = await db.all(
      `
        SELECT d.name, c.number AS car_number 
        FROM drivers d 
        INNER JOIN lap_times l ON d.id = l.driver_id 
        INNER JOIN cars c ON c.number = l.car_number 
        WHERE l.race_session_id = ?`,
      [race.id]
    );
    race.drivers = drivers.map((driver) => ({
      name: driver.name,
      car_number: driver.car_number,
    }));
    race.drivers = drivers;
    race.status = "Active";
    return race;
  } catch (error) {
    console.error("Error fetching ongoing race:", error);
    return null;
  } finally {
    await db.close();
  }
};
