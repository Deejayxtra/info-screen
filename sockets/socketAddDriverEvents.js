import { openDb } from "../db/database.js";


export const setupAddDriverEvents = (io, socket) => {
    // Add a driver to a race session
    socket.on("addDriver", async ({ raceId, driverName }) => {
        const db = await openDb();
        try {
            await db.run("BEGIN TRANSACTION");

            // Check if the driver already exists
            let driver = await db.get("SELECT * FROM drivers WHERE name = ?", [
            driverName,
            ]);

            // Assign a car based on availability
            const car = await db.get(
            'SELECT * FROM cars WHERE status = "Available" ORDER BY number LIMIT 1'
            );
            if (!car) {
            io.emit("error", "No available cars.");
            await db.run("ROLLBACK");
            return;
            }

            // If driver doesn't exist, add the driver along with car_number
            if (!driver) {
            await db.run(
                "INSERT INTO drivers (name, car_number, race_session_id) VALUES (?, ?, ?)",
                [driverName, car.number, raceId]
            );
            driver = await db.get("SELECT * FROM drivers WHERE name = ?", [
                driverName,
            ]);
            }

            // Check if the driver is already assigned to a car in this session
            const existingCarAssignment = await db.get(
            "SELECT * FROM lap_times WHERE race_session_id = ? AND driver_id = ?",
            [raceId, driver.id]
            );
            if (existingCarAssignment) {
            io.emit("error", `Driver ${driverName} is already assigned to a car.`);
            await db.run("ROLLBACK");
            return;
            }

            // Add the driver to the lap_times table
            await db.run(
            "INSERT INTO lap_times (race_session_id, driver_id, car_number, lap_number, lap_time) VALUES (?, ?, ?, ?, ?)",
            [raceId, driver.id, car.number, 0, 0]
            );

            // Mark the car as 'In Use'
            await db.run('UPDATE cars SET status = "In Use" WHERE number = ?', [
            car.number,
            ]);

            await db.run("COMMIT");

            // Emit the updated race list
            const races = await db.all("SELECT * FROM race_sessions");
            for (const race of races) {
            const drivers = await db.all(
                `
                        SELECT d.name, l.car_number 
                        FROM drivers d
                        INNER JOIN lap_times l ON d.id = l.driver_id
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
            console.error("Error adding driver:", err);
            await db.run("ROLLBACK");
            io.emit("error", "Failed to add driver.");
        } finally {
            await db.close();
        }
    });
}

