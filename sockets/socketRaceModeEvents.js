import { openDb } from "../db/database.js";
import { updateRaceMode } from "../utils/updateRaceMode.js";


export const setupRaceModeEvents = (io, socket) => {
  // Emit the updated race status to all clients
  const emitRaceStatus = async (raceId, mode, callback) => {
    const db = await openDb();
    try {
      // Update the race mode in the database
      const result = await updateRaceMode(raceId, mode);

      // Notify the client who initiated the event of the successful update
      callback(result);

      // Broadcast the mode change to all connected clients
      io.emit("raceStatus", mode );
    } catch (error) {
      // Handle errors and send them to the client who initiated the event
      callback({ error: error.message });
    } finally {
      await db.close();
    }
  };

  // Listen for the setRaceMode event and call emitRaceStatus
  socket.on("setRaceMode", (data, callback) => {
    const { raceId, mode } = data;
    emitRaceStatus(raceId, mode, callback);
  });
};
