import { startRaceService, endRaceService } from '../services/raceService.js';

export function startRace (req, res) {
    startRaceService();
    res.json({ success: true, message: 'Race started' });
};


export function endRace(req, res) {
    endRaceService();

    const { raceSessionId } = req.body;

    // Get race results after the race ends
    getRaceResults(raceSessionId)
        .then((results) => {
            res.json({ success: true, message: 'Race ended', results });
        })
        .catch((error) => {
            console.error('Error getting race results:', error);
            res.status(500).json({ success: false, message: 'Error getting race results' });
        });
}

export default { startRace, endRace };
