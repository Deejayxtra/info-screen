import { openDb } from "../db/database.js";
import { getLeaderboardData } from "../utils/getLeaderBoardData.js";

export const setupUpdateLapTimeEvents = (io, socket) => {
    const updateLapTimeEvents =  () => {
      // Server-side code for updating lap times
      socket.on("updateLapTime", async ({ driverId, currentLapTime }) => {
        const db = await openDb();
        try {
          // Get the current race session ID
          const raceSession = await db.get(
            `SELECT id, start_time FROM race_sessions WHERE status = 'Active' LIMIT 1`
          );
          if (!raceSession) {
            console.error("No active race session found.");
            return;
          }

          const raceSessionId = raceSession.id;

          // Get the driver's last lap timestamp
          const lastLap = await db.get(
            `SELECT lap_time, lap_number, last_lap_timestamp FROM lap_times WHERE race_session_id = ? AND driver_id = ? ORDER BY lap_number DESC LIMIT 1`,
            [raceSessionId, driverId]
          );

          let newLapNumber;
          let lapDuration; // Store the duration of the current lap
          if (lastLap) {
            // Calculate the lap time as the difference between the current time and the last lap timestamp
            const previousTimestamp = new Date(
              lastLap.last_lap_timestamp
            ).getTime();
            const currentTimestamp = new Date(currentLapTime).getTime();

            if (lastLap.lap_number === 0) {
              const raceStartTime = new Date(raceSession.start_time).getTime();
              lapDuration = (currentTimestamp - raceStartTime) / 1000; // Difference in seconds
            } else {
              lapDuration = (currentTimestamp - previousTimestamp) / 1000;
            }

            newLapNumber = lastLap.lap_number + 1;
          } else {
            throw new Error(
              `Race has not started for driver with id ${driverId}`
            );
          }

          // Update the lap time, last lap timestamp, and lap number for the existing record in the database
          await db.run(
            `
                        UPDATE lap_times 
                        SET lap_time = ?, last_lap_timestamp = ?, lap_number = ?
                        WHERE race_session_id = ? AND driver_id = ?
                        `,
            [
              lapDuration, // The calculated lap duration
              currentLapTime, // The current timestamp for this lap
              newLapNumber, // The lap number to update in the record
              raceSessionId, // Race session ID
              driverId, // Driver ID
            ]
          );

          // Check if it's the driver's fastest lap
          const currentFastestLap = await db.get(
            `SELECT fastest_lap_time FROM leaderboard WHERE driver_id = ? AND race_session_id = ?`,
            [driverId, raceSessionId]
          );

          if (
            !currentFastestLap ||
            lapDuration < currentFastestLap.fastest_lap_time ||
            currentFastestLap.fastest_lap_time === null
          ) {
            // Update the leaderboard with the new fastest lap time
            await db.run(
              `
                        UPDATE leaderboard
                        SET fastest_lap_time = ?
                        WHERE driver_id = ? AND race_session_id = ?`,
              [lapDuration, driverId, raceSessionId]
            );
          }

          await getLeaderboardData(io);
        } catch (error) {
          console.error("Error updating lap time:", error);
        } finally {
          await db.close();
        }
      });
    }
    socket.on("updateLapTime", updateLapTimeEvents);
}
