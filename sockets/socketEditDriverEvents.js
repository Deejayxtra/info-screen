import { openDb } from "../db/database.js";


export const setupEditDriverEvents = (io, socket) => {
  // Add the editDriver socket event handler
  socket.on("editDriver", async ({ raceId, oldDriverName, newDriverName }) => {
    const db = await openDb();
    try {
      // Find the existing driver by the old name
      const driver = await db.get("SELECT * FROM drivers WHERE name = ?", [
        oldDriverName,
      ]);

      if (!driver) {
        io.emit("error", "Driver not found.");
        return;
      }

      // Check if the new driver name already exists
      const existingDriver = await db.get(
        "SELECT * FROM drivers WHERE name = ?",
        [newDriverName]
      );
      if (existingDriver) {
        io.emit("error", "A driver with that name already exists.");
        return;
      }

      // Update the driver's name
      await db.run("UPDATE drivers SET name = ? WHERE id = ?", [
        newDriverName,
        driver.id,
      ]);

      // Emit the updated race list
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
    } catch (err) {
      console.error("Error editing driver:", err);
      io.emit("error", "Failed to edit driver.");
    }
  });
}

