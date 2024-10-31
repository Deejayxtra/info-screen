import { openDb } from "../db/database.js";



export const raceListUpdate = async (io) => {
    const db = await openDb();
    try {
      const races = await db.all(
        'SELECT * FROM race_sessions where status = "Upcoming"'
      );
      for (const race of races) {
        const drivers = await db.all(
          `
            SELECT d.name, c.number AS car_number 
            FROM drivers d 
            INNER JOIN lap_times l ON d.id = l.driver_id 
            INNER JOIN cars c ON c.number = l.car_number 
            WHERE l.race_session_id = ?
        `,
          [race.id]
        );
        race.drivers = drivers.map((driver) => ({
          name: driver.name,
          car_number: driver.car_number,
        }));
      }
      io.emit("raceList", races);
    } catch (err) {
      console.error("Error fetching race sessions:", err);
      io.emit("error", "Failed to fetch race session list.");
    }

};
