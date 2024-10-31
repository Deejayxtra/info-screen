import {  getRaceWithFinishStatus } from "../utils/getRaceWithFinishStatus.js";
import { getTheNextRaceSession } from "../utils/getTheNextRaceSession.js";
import { getCurrentRace } from "../utils/getCurrentRace.js";

// Set race duration based on the environment
const isDevelopment = process.env.NODE_ENV === "development";
const raceDuration = isDevelopment ? 1 * 60 * 1000 : 10 * 60 * 1000; // 1 minute for dev, 10 minutes for prod

export const setupGetRaceControlData = (io, socket) => {
    socket.on("getRaceControlData", async () => {
        let result = await getCurrentRace();
        if (result) {
            result.raceDuration = raceDuration;
            io.emit("raceControlData", result);
            return;
        } else {
            result = await getRaceWithFinishStatus();
            if (result) {
                result.raceDuration = raceDuration;
                io.emit("raceControlData", result);
                return;
            }
            result = await getTheNextRaceSession();
            if (result.status === "no_race") {
                io.emit("raceControlData", null);
            } else {
                result.raceDuration = raceDuration;
                // Proceed with handling the race session details
                io.emit("raceControlData", result);
            }
        }
    });        
}