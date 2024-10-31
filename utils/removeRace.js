import { openDb } from "../db/database.js";


export async function removeRace() {
    try {
      const db2 = await openDb(); // Re-open a new database connection

      // Select all race IDs with status 'Active', 'Finished', 'Cancelled' or 'Finish'
      const raceIds = await db2.all(`
            SELECT id FROM race_sessions WHERE status IN ('Active', 'Finished', 'Cancelled', 'Finish')
        `);

      if (raceIds.length === 0) {
        return true;
      }

      for (const race of raceIds) {
        const raceId = race.id;

        // Update the status of cars associated with this race's drivers to 'Available'
        await db2.run(
          `
                UPDATE cars 
                SET status = 'Available' 
                WHERE number IN (
                    SELECT car_number FROM drivers WHERE race_session_id = ?
                )
            `,
          [raceId]
        );

        // Delete drivers associated with this race
        await db2.run("DELETE FROM drivers WHERE race_session_id = ?", [
          raceId,
        ]);

        // Delete the race session itself
        await db2.run("DELETE FROM race_sessions WHERE id = ?", [raceId]);

        // Optionally, delete lap_times and leaderboard data for this race
        await db2.run("DELETE FROM lap_times WHERE race_session_id = ?", [
          raceId,
        ]);
        await db2.run("DELETE FROM leaderboard WHERE race_session_id = ?", [
          raceId,
        ]);
        await db2.run("DELETE FROM race_flags WHERE race_session_id = ?", [
          raceId,
        ]);
      }

      return true;
    } catch (error) {
        console.error('Error removing race:', error);
        return false;
    }
}