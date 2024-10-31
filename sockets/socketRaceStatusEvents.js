import { openDb } from "../db/database.js";



export const setupRaceStatusEvents = (io, socket) => {
  const emitRaceStatus = async () => {
    const db = await openDb();
        try {
          // Fetch the active race session (assuming there's only one active session)
          const raceSession = await db.get(
            `SELECT * FROM race_sessions WHERE status IN ('Active', 'Finished', 'Cancelled', 'Finish')`
          );

          // If no active race session is found, emit an error and return
          if (!raceSession) {
            io.emit("error", "No ongoing race session found.");
            return;
          }

          // Fetch the race flags for the active race session
          const raceFlag = await db.get(
            "SELECT * FROM race_flags WHERE race_session_id = ?",
            raceSession.id
          );

          // Check if race flag exists
          if (!raceFlag) {
            io.emit("error", "No race flags found for this session.");
            return;
          }

          // Emit the race status to the client
          io.emit("raceStatus", raceFlag.status); // Emit to all clients
        } catch (err) {
            console.error("Error fetching race status:", err);
            io.emit("error", "Failed to fetch race status.");
        } finally {
            await db.close(); // Always ensure the database is closed after operations
        }
    };

  socket.on("getRaceStatus", emitRaceStatus);
};                                       

