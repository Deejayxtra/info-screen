import { openDb } from "../db/database.js";
import { updateRaceMode } from "../utils/updateRaceMode.js";
import { getLeaderboardData } from "../utils/getLeaderBoardData.js";


export const setupEndRaceSessionEvents = (io, socket) => {
  // Handle 'endRaceSession' event
  socket.on("endRaceSession", async (data, callback) => {
    const { raceId } = data;

        try {
          const db = await openDb(); // Open database connection

          // Update the race session status to 'Finished'
          await db.run("UPDATE race_sessions SET status = ? WHERE id = ?", [
            "Finished",
            raceId,
          ]);

          // Call the callback to notify the client that the race has ended successfully
          callback({ message: "Race ended successfully" });

          // Update the race mode in the database
          await updateRaceMode(raceId, "Finished");

          // Emit an event to update all clients about the race status
          io.emit("raceStatus", "Finished"); // Emit to all clients
          await getLeaderboardData(io);

          // Close the database connection after the initial queries
          await db.close();
          io.emit("race-ended", data);
        } catch (error) {
        console.error("Error ending race session:", error);
        callback({ error: "Failed to end race session" });
        }
    });
}

