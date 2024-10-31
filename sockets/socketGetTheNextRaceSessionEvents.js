import { openDb } from "../db/database.js";

export const setupGetTheNextRaceSessionEvents = (io, socket) => {
    socket.on("getTheNextRaceSession", async () => {
      const db = await openDb();
      getTheNextRaceSession()
        .then((result) => {
          if (result.status === "no_race") {
            io.emit("nextRaceSession", null);
          } else {
            // Proceed with handling the race session details
            io.emit("nextRaceSession", result);
          }
        })
        .catch((err) => {
          console.error(err.message); // Handle other errors
        });
    });
}

