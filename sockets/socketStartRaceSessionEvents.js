import { openDb } from "../db/database.js";
import { updateRaceMode } from "../utils/updateRaceMode.js";
import { removeRace } from "../utils/removeRace.js";
import { getLeaderboardData } from "../utils/getLeaderBoardData.js";
import { raceListUpdate } from "../utils/raceListUpdate.js";


export const setupStartRaceSessionEvents = (io, socket) => {            
   // Handle 'startRaceSession' event
    socket.on("startRaceSession", async (data, callback) => {
    const { raceId } = data;
    const db = await openDb();

    let oldRaceToBeRemoved = await removeRace();
    if (oldRaceToBeRemoved) {
        try {
        // Get the current local time as a formatted string (YYYY-MM-DD HH:MM:SS)
        const currentLocalTime = new Date()
            .toLocaleString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            })
            .replace(",", ""); // Replace the comma

        // Update the race session status to 'Active' and set the start_time to the current local timestamp
        await db.run(
            "UPDATE race_sessions SET status = ?, start_time = ? WHERE id = ?",
            ["Active", currentLocalTime, raceId]
        );

        // Update the race mode in the database
        await updateRaceMode(raceId, "Safe");

        // Fetch the drivers participating in this race session
        const drivers = await db.all(
            "SELECT id, car_number FROM drivers WHERE race_session_id = ?",
            [raceId]
        );

        if (drivers.length > 0) {
            for (const driver of drivers) {
            const { id: driverId, car_number: carNumber } = driver;

            // Check if an entry already exists in the lap_times table
            const existingLapTime = await db.get(
                "SELECT * FROM lap_times WHERE race_session_id = ? AND driver_id = ?",
                [raceId, driverId]
            );

            if (!existingLapTime) {
                // Insert initial lap time for lap 1 (or 0) in lap_times table
                await db.run(
                `INSERT INTO lap_times (race_session_id, driver_id, car_number, lap_number, lap_time, last_lap_timestamp)
                        VALUES (?, ?, ?, ?, ?, ?)`,
                [raceId, driverId, carNumber, 0, 0, currentLocalTime]
                );
            }

            // Check if an entry already exists in the leaderboard table
            const existingLeaderboardEntry = await db.get(
                "SELECT * FROM leaderboard WHERE race_session_id = ? AND driver_id = ?",
                [raceId, driverId]
            );

            if (!existingLeaderboardEntry) {
                // Insert initial leaderboard entry for this driver
                await db.run(
                `INSERT INTO leaderboard (race_session_id, driver_id, car_number, fastest_lap_time, current_position)
                        VALUES (?, ?, ?, ?, ?)`,
                [raceId, driverId, carNumber, null, 0]
                );
            }
            }
        }

        await getLeaderboardData(io);
        await raceListUpdate(io);

        // Emit an event to update all clients about the race status
        io.emit("raceStatus", "Safe"); // Emit to all clients
        io.emit("race-started", data);

        // Optionally, you can send an acknowledgment back to the client
        callback({ message: "Race started successfully" });
        } catch (error) {
        console.error("Error starting race session:", error);
        callback({ error: "Failed to start race session" });
        } finally {
        await db.close();
        }
    }
    }); 
    
}


