export function authMiddleware(keyName) {
    return (req, res, next) => {
        const key = process.env[keyName];
        if (req.query.accessKey !== key) {
            return setTimeout(() => {
                res.status(403).json({ error: 'Invalid access key' });
            }, 500);
        }
        next();
    };
}

export default authMiddleware;
