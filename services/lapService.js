import { openDb } from '../db/database.js';

// Function to generate random lap times between 60 and 120 seconds
const generateRandomLapTime = () => Math.floor(Math.random() * (120 - 60 + 1)) + 60;

// Function to handle the lap completion for a driver
export const completeLap = async (raceSessionId, driverId, carNumber, lapNumber) => {
    const db = await openDb();
    try {
        const lapTime = generateRandomLapTime();

        // Insert the lap time into the lap_times table
        await db.run(`
            INSERT INTO lap_times (race_session_id, driver_id, car_number, lap_number, lap_time)
            VALUES (?, ?, ?, ?, ?)
        `, [raceSessionId, driverId, carNumber, lapNumber, lapTime]);

        // Optionally emit this lap time to connected clients via sockets
        return { driverId, lapNumber, lapTime, message: 'Lap completed' };
    } catch (error) {
        console.error('Error completing lap:', error);
        throw new Error('Failed to complete lap');
    } finally {
        await db.close();
    }
};

// Function to get race results after the race ends
export const getRaceResults = async (raceSessionId) => {
    const db = await openDb();
    try {
        // Query to get the total lap times for each driver
        const results = await db.all(`
            SELECT drivers.name, drivers.car_number, SUM(lap_times.lap_time) AS total_time
            FROM lap_times
            INNER JOIN drivers ON lap_times.driver_id = drivers.id
            WHERE lap_times.race_session_id = ?
            GROUP BY drivers.id
            ORDER BY total_time ASC
        `, [raceSessionId]);

        return results;
    } catch (error) {
        console.error('Error getting race results:', error);
        throw new Error('Failed to get race results');
    } finally {
        await db.close();
    }
};
