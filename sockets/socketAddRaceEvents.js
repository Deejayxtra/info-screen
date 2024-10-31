// socketRaceEvents.js
import { openDb } from "../db/database.js";

export const setupAddRaceEvents = (io, socket) => {
  // Add a new race session without a start time
  socket.on("addRace", async (data) => {
    const { name } = data; // Only expect the name from the client

    const db = await openDb();

    try {
      // Check if a race with the same name already exists in the database
      const existingRace = await db.get(
        "SELECT * FROM race_sessions WHERE name = ?",
        [name]
      );

      if (existingRace) {
        // If a race with the same name exists, inform the client
        io.emit("error", `A race with the name '${name}' already exists.`);
      } else {
        // Insert the new race session into the database with just the name
        await db.run("INSERT INTO race_sessions (name) VALUES (?)", [name]);

        // Query the updated race session list
        const races = await db.all("SELECT * FROM race_sessions");
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
      }
    } catch (err) {
      console.error("Error inserting race session into database:", err);
      io.emit("error", "Failed to add race session.");
    } finally {
      await db.close();
    }
  });
};