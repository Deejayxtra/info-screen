import { openDb } from "../db/database.js";


// Function to get the next race session
export const getTheNextRaceSession = async () => {
  const db = await openDb();
  try {
    // Check if there is an upcoming race session
    const race = await db.get(
      `SELECT * FROM race_sessions WHERE status = 'Upcoming' LIMIT 1`
    );
    if (!race) {
      // throw new Error('No upcoming race sessions found');
      return {
        message: "Waiting for upcoming race to be updated",
        status: "no_race",
      };
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
    race.status = "Upcoming";
    return race;
  } catch (error) {
    console.error("Error fetching the next race session:", error);
    throw new Error(`Failed to fetch the next race session: ${error.message}`);
  } finally {
    await db.close(); // Ensure the database connection is closed
  }
};
