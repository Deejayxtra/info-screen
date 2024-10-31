import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupDatabase, openDb } from "./db/database.js";
import validateAccessKeyRoute from "./routes/validateAccessKeyRoutes.js";
import { loadEnv } from "./config/env.js";
import cors from "cors";


// Import socket event handler modules
import { setupRaceStatusEvents } from "./sockets/socketRaceStatusEvents.js";
import { setupRaceListEvents } from "./sockets/socketRaceListEvents.js"; 
import { setupAddRaceEvents } from "./sockets/socketAddRaceEvents.js";
import { setupRemoveRaceEvents } from "./sockets/socketRemoveRaceEvents.js";
import { setupAddDriverEvents } from "./sockets/socketAddDriverEvents.js";
import { setupRemoveDriverEvents } from "./sockets/socketRemoveDriverEvents.js";
import { setupEditDriverEvents } from "./sockets/socketEditDriverEvents.js";
import { setupRaceModeEvents } from "./sockets/socketRaceModeEvents.js";
import { setupStartRaceSessionEvents } from "./sockets/socketStartRaceSessionEvents.js";
import { setupEndRaceSessionEvents } from "./sockets/socketEndRaceSessionEvents.js";
import { setupLeaderboardEvents } from "./sockets/socketLeaderboardEvents.js";
import { setupGetTheNextRaceSessionEvents } from "./sockets/socketGetTheNextRaceSessionEvents.js";
import { setupGetRaceControlData } from "./sockets/socketGetRaceControlData.js";
import { setupUpdateLapTimeEvents } from "./sockets/socketUpdateLapTimeEvents.js";


// Initialize Express app
const app = express();
const server = createServer(app);

let db; // Declare database variable outside for wider scope

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Load environment variables
loadEnv();

// Async function to initialize the database and start the server
const startServer = async () => {
  try {
    // Check if the required environment variables are set
    const requiredEnvVariables = ["RECEPTIONIST_KEY", "SAFETY_KEY", "OBSERVER_KEY"];
    requiredEnvVariables.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    });

    db = await openDb(); // Initialize the database connection
    console.log("Database connection established.");

    await setupDatabase(); // Setup database tables and configurations
    console.log("Database initialized.");

    // Setup middlewares and routes
    app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST"],
      })
    );

    app.use(express.json());
    app.use("/api/v1.0", validateAccessKeyRoute);

    // Setup namespaces
    const namespace = io.of("/namespace");
    namespace.on("connection", (socket) => {
      console.log("A user connected to namespace");
      // Handle namespace-specific events here
    });

    // Handle socket.io events
    io.on("connection", async (socket) => {
      console.log("A user connected");


      // Setup socket event handlers from different files
      setupRaceListEvents(io, socket);
      setupRaceStatusEvents(io, socket);
      setupAddRaceEvents(io, socket);
      setupRemoveRaceEvents(io, socket);
      setupAddDriverEvents(io, socket);
      setupRemoveDriverEvents(io, socket);
      setupEditDriverEvents(io, socket);
      setupRaceModeEvents(io, socket);
      setupStartRaceSessionEvents(io, socket);
      setupEndRaceSessionEvents(io, socket);
      setupLeaderboardEvents(io, socket);
      setupGetTheNextRaceSessionEvents(io, socket);
      setupGetRaceControlData(io, socket);
      setupUpdateLapTimeEvents(io, socket);


      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

    // Start the server
    const PORT = process.env.PORT || 5050;
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Failed to initialize server or database:", error);
  }
};

// Start the server
startServer();
