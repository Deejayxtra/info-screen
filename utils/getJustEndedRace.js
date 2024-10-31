import { openDb } from "../db/database.js";


export const getJustEndedRace = async () => {
  const db = await openDb();
  try {
    // Assuming there is a 'race_sessions' table where the endedRace race has an finished status
    const endedRace = await db.get(`
        SELECT id, start_time FROM race_sessions
        WHERE status = 'Finished' LIMIT 1
    `);
    return endedRace ? endedRace : null;
  } catch (error) {
    console.error("Error fetching ongoing race:", error);
    return null;
  } finally {
    await db.close();
  }
};
