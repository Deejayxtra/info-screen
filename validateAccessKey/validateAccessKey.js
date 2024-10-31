import { openDb } from '../db/database.js';

export const validateAccessKey = async (req, res, next) => {
  console.log('Validating access key...:', req.headers['access-key']);
  const db = await openDb();  // Ensure the database connection is opened
  const accessKey = req.headers['access-key'];
  const userRole = role(req.headers['path']);


  try {
    // Await the database query to avoid using a callback
    const row = await db.get('SELECT * FROM access_keys WHERE role = ? AND key = ?', [userRole, accessKey]);

    if (row) {  // Access key is valid
      console.log('Valid access key, proceeding...', req.headers['access-key']);
      return next();
    } else {  // No access key found
      console.log("Invalid access key, no match found...");
      setTimeout(() => {
        return res.status(403).json({ message: 'Invalid access key' });
      }, 500);
    }
  } catch (err) {
    console.error('Error querying database:', err);
    setTimeout(() => {
      return res.status(403).json({ message: 'Invalid access key' });
    }, 500);
  }
};

function role(path) {
  switch (path) {
    case '/race-control':
      return 'safety official';
    case '/lap-line-tracker':
      return 'lap-line observer';
    default:
      return 'receptionist';
  }
}

//laplineObserver