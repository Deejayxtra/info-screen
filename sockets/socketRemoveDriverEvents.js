import { openDb } from "../db/database.js";

export const setupRemoveDriverEvents = (io, socket) => {
  // Remove a driver from a race session
    socket.on("removeDriver", async ({ raceId, driverName }) => {
        const db = await openDb();
        try {
        // Find the driver
        const driver = await db.get("SELECT * FROM drivers WHERE name = ?", [
            driverName,
        ]);

        if (!driver) {
            io.emit("error", "Driver not found.");
            return;
        }

        // Get the car number assigned to this driver in the current race session
        const car = await db.get(
            `
                        SELECT c.number 
                        FROM cars c
                        INNER JOIN lap_times l ON c.number = l.car_number
                        WHERE l.race_session_id = ? AND l.driver_id = ?
                    `,
            [raceId, driver.id]
        );

        if (!car) {
            io.emit("error", "Car for this driver not found.");
            return;
        }

        // Remove the driver from the race session (lap_times table)
        const result = await db.run(
            "DELETE FROM lap_times WHERE race_session_id = ? AND driver_id = ?",
            [raceId, driver.id]
        );

        if (result.changes === 0) {
            io.emit("error", "Driver is not part of this race session.");
        } else {
            // Update the car's status to 'Available'
            await db.run("UPDATE cars SET status = ? WHERE number = ?", [
            "Available",
            car.number,
            ]);

            // Remove the driver from the drivers table
            const result = await db.run("DELETE FROM drivers WHERE id = ?", [
            driver.id,
            ]);

            if (result.changes === 0) {
            io.emit("error", "Unable to remove driver.");
            } else {
            // Retrieve the updated race sessions and drivers
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

            // Send the updated race list to the client
            io.emit("raceList", races);
            }
        }
        } catch (err) {
        console.error("Error removing driver:", err);
        io.emit("error", "Failed to remove driver.");
        }
  });
}

