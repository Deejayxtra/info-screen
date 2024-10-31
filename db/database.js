import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Function to open the database connection
export const openDb = async () => {
    return open({
        filename: './db/racetrack.db',
        driver: sqlite3.Database
    });
};

// Function to set up the database and create tables
export const setupDatabase = async () => {
    const db = await openDb();

    try {
        // Create race_sessions table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS race_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                start_time TIMESTAMP,
                status TEXT CHECK(status IN ('Upcoming', 'Active', 'Finish', 'Finished', 'Cancelled')) NOT NULL DEFAULT 'Upcoming'
            );
        `);

        // Create drivers table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                car_number STRING UNIQUE NOT NULL,
                race_session_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (race_session_id) REFERENCES race_sessions(id) ON DELETE CASCADE
                FOREIGN KEY (car_number) REFERENCES cars(number)
            );
        `);

        // Create cars table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS cars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number STRING UNIQUE NOT NULL,
                status TEXT CHECK(status IN ('Available', 'In Use', 'Maintenance')) NOT NULL DEFAULT 'Available'
            );
        `);

        // Insert initial data into the cars table, avoiding duplicates
        const { count: carCount } = await db.get('SELECT COUNT(*) as count FROM cars');
        if (carCount === 0) {
            await db.run(`
                INSERT INTO cars (number, status)
                VALUES
                    (100, 'Available'),
                    (200, 'Available'),
                    (300, 'Available'),
                    (400, 'Available'),
                    (500, 'Available'),
                    (600, 'Available'),
                    (700, 'Available'),
                    (800, 'Available'),
                    (900, 'Available'),
                    (101, 'Available'),
                    (111, 'Available'),
                    (112, 'Available'),
                    (113, 'Available'),
                    (114, 'Available'),
                    (115, 'Available'),
                    (116, 'Available'),
                    (550, 'Available'),
                    (350, 'Available'),
                    (430, 'Available'),
                    (250, 'Available'),
                    (120, 'Available'),
                    (333, 'Available'),
                    (665, 'Available'),
                    (303, 'Available'),
                    (777, 'Available'),
                    (888, 'Available'),
                    (999, 'Available'),
                    (710, 'Available')  
            `);
        }

        // Create race_flags table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS race_flags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                race_session_id INTEGER,
                status TEXT CHECK(status IN ('Safe', 'Hazard', 'Danger', 'Finish', 'Finished')) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (race_session_id) REFERENCES race_sessions(id) ON DELETE CASCADE
            );
        `);

        // Create lap_times table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS lap_times (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                race_session_id INTEGER,
                driver_id INTEGER,
                car_number STRING,
                lap_number INTEGER NOT NULL,
                lap_time INTEGER NOT NULL,
                last_lap_timestamp TIMESTAMP,
                FOREIGN KEY (race_session_id) REFERENCES race_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
                FOREIGN KEY (car_number) REFERENCES cars(number)
            );
        `);

        // Create leaderboard table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                race_session_id INTEGER,
                driver_id INTEGER,
                car_number STRING,
                fastest_lap_time INTEGER,
                current_position INTEGER,
                FOREIGN KEY (race_session_id) REFERENCES race_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
                FOREIGN KEY (car_number) REFERENCES cars(number)
            );
        `);

        // Create race_observers table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS race_observers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                race_session_id INTEGER,
                car_number STRING,
                lap_button_pressed INTEGER CHECK(lap_button_pressed IN (0, 1)) DEFAULT 0,
                lap_count INTEGER DEFAULT 0,
                FOREIGN KEY (race_session_id) REFERENCES race_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (car_number) REFERENCES cars(number)
            );
        `);

        // Create access_keys table (unchanged from original)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS access_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                key TEXT NOT NULL
            );
        `);

        // Insert initial data for access_keys table, avoiding duplicates
        const { count: accessKeyCount } = await db.get('SELECT COUNT(*) as count FROM access_keys');
        if (accessKeyCount === 0) {
            await db.run(`
                INSERT INTO access_keys (role, key)
                VALUES
                    ('receptionist', '8ded6076'),
                    ('safety official', 'a2d393bc'),
                    ('lap-line observer', '662e0f6c')
            `);
        }

    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await db.close();
    }
};

// Execute the database setup
setupDatabase().catch((err) => console.error('Error:', err));
