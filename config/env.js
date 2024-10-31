import dotenv from 'dotenv';

dotenv.config();

export const loadEnv = () => {
    console.log('Environment variables:', process.env); // Debug log

    const requiredKeys = ['RECEPTIONIST_KEY', 'SAFETY_KEY', 'OBSERVER_KEY'];
    for (const key of requiredKeys) {
        if (!process.env[key]) {
            throw new Error(`Missing environment variable: ${key}`);
        }
    }
};
