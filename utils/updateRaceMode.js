import { openDb } from '../db/database.js'; 


// Function to update race mode in the database
export const updateRaceMode = async (raceId, newMode) => {
    const db = await openDb();
    try {
      // Check if the race session exists
      const race = await db.get(
        "SELECT * FROM race_sessions WHERE id = ?",
        raceId
      );
      if (!race) {
        throw new Error(`Race session with ID ${raceId} not found`);
      }

      // Check if the mode is valid
      const validModes = ["Safe", "Hazard", "Danger", "Finish", "Finished"];
      if (!validModes.includes(newMode)) {
        throw new Error(`Invalid race mode: ${newMode}`);
      }

      if (newMode === "Finish") {
        // Update the race_session status
        await db.run(
          `
                    UPDATE race_sessions
                    SET status = ?
                    WHERE id = ?
                `,
          [newMode, raceId]
        );
      }

      // Check if race mode already exists in race_flags table
      const existingFlag = await db.get(
        "SELECT * FROM race_flags WHERE race_session_id = ?",
        raceId
      );

      if (existingFlag) {
        // Update the race mode if it exists
        await db.run(
          `
                    UPDATE race_flags
                    SET status = ?, timestamp = CURRENT_TIMESTAMP
                    WHERE race_session_id = ?
                `,
          [newMode, raceId]
        );
      } else {
        // Handle the case where the race flag doesn't exist and optionally insert
        await db.run(
          `
                INSERT INTO race_flags (race_session_id, status, timestamp)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `,
          [raceId, newMode]
        );
      }

      return { raceId, newMode, message: `Race mode updated to ${newMode}` };
    } catch (error) {
        console.error(`Error updating race mode for raceId ${raceId}:`, error);
        throw new Error(`Failed to update race mode: ${error.message}`);
    } finally {
        await db.close(); // Ensure the database connection is closed
    }
};