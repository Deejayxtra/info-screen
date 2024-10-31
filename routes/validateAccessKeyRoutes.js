import express from 'express';
import { validateAccessKey } from '../validateAccessKey/validateAccessKey.js';

const router = express.Router();

// Example of protecting the /race-control route for Safety Officials
router.post('/', validateAccessKey, (req, res) => {
  res.json({ message: 'Access granted to race control!' });
});


export default router;