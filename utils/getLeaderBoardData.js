import { openDb } from "../db/database.js";
import { getCurrentRace } from "./getCurrentRace.js";
import { getJustEndedRace } from "./getJustEndedRace.js";



// Set race duration based on the environment
const isDevelopment = process.env.NODE_ENV === "development";
const raceDuration = isDevelopment ? 1 * 60 * 1000 : 10 * 60 * 1000; // 1 minute for dev, 10 minutes for prod

export const getLeaderboardData = async (io) => {
  const db = await openDb();
  let race = await getCurrentRace(); // Fetch the current ongoing race

  if (!race) {
    console.error("No ongoing race found");
    // return;
    race = await getJustEndedRace();
    if (!race) {
      io.emit("leaderboard-update", null);
      return;
    }
    race.race_ended = true;
  }

  try {
    // Simplified query to debug the basic leaderboard and driver data
    const leaderboardData = await db.all(
      `
        SELECT 
            lb.driver_id, 
            lb.car_number, 
            lb.fastest_lap_time, 
            lb.current_position, 
            d.name, 
            lt.lap_number, 
            lt.lap_time,
            lt.last_lap_timestamp
        FROM 
            leaderboard lb
        JOIN 
            drivers d ON lb.driver_id = d.id
        LEFT JOIN (
            SELECT 
                driver_id, 
                lap_number, 
                lap_time,
                last_lap_timestamp
            FROM 
                lap_times
            WHERE 
                race_session_id = ?
        ) lt ON lb.driver_id = lt.driver_id
        WHERE 
            lb.race_session_id = ?
        ORDER BY
            lb.fastest_lap_time ASC
        `,
      [race.id, race.id]
    );

    const lapLineObserverData = await db.all(
      `
        SELECT 
            lb.driver_id, 
            lb.car_number, 
            lb.fastest_lap_time, 
            lb.current_position, 
            d.name, 
            lt.lap_number, 
            lt.lap_time
        FROM 
            leaderboard lb
        JOIN 
            drivers d ON lb.driver_id = d.id
        LEFT JOIN (
            SELECT 
                driver_id, 
                lap_number, 
                lap_time
            FROM 
                lap_times
            WHERE 
                race_session_id = ?
        ) lt ON lb.driver_id = lt.driver_id
        WHERE 
            lb.race_session_id = ?
        `,
      [race.id, race.id]
    );
    // Emit the leaderboard data to the client
    io.emit("leaderboard-update", {
      drivers: leaderboardData,
      startTime: race.start_time,
      raceEnded: race.race_ended || false,
      raceDuration: raceDuration,
    });
    io.emit("lapline-update", {
      drivers: lapLineObserverData,
      startTime: race.start_time,
      raceEnded: race.race_ended || false,
    });
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
  } finally {
    await db.close();
  }
};
