import { openDb } from "../db/database.js";


export const setupRemoveRaceEvents = (io, socket) => {
  // Remove a race session and its related data
    socket.on("removeRace", async (raceId) => {
        const db = await openDb();
        try {
            // 1. Find all drivers that are part of this race
            const drivers = await db.all(
                `
                        SELECT d.id, d.name, c.number AS car_number 
                        FROM drivers d
                        INNER JOIN lap_times l ON d.id = l.driver_id
                        INNER JOIN cars c ON l.car_number = c.number
                        WHERE l.race_session_id = ?
                    `,
                [raceId]
            );

            if (drivers.length > 0) {
                // 2. Update the cars' status to 'Available' for all drivers in the race
                const carNumbers = drivers.map((driver) => driver.car_number);
                const carPlaceholders = carNumbers.map(() => "?").join(", ");
                await db.run(
                `UPDATE cars SET status = 'Available' WHERE number IN (${carPlaceholders})`,
                carNumbers
                );

                // 3. Update the drivers to remove the race session ID
                const driverIds = drivers.map((driver) => driver.id);
                const driverPlaceholders = driverIds.map(() => "?").join(", ");
                // await db.run(`UPDATE drivers SET race_session_id = NULL WHERE id IN (${driverPlaceholders})`, driverIds);
                await db.run(
                `DELETE FROM drivers WHERE id IN (${driverPlaceholders})`,
                driverIds
                );
            }

            // 4. Remove all lap_times and the race session itself
            await db.run("DELETE FROM lap_times WHERE race_session_id = ?", [raceId]);
            await db.run("DELETE FROM race_sessions WHERE id = ?", [raceId]);

            // 5. Emit the updated race list
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
            console.error("Error removing race session:", err);
            io.emit("error", "Failed to remove race session.");
        }
    });
}

