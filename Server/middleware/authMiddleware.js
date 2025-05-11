// authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateHost = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'host') {
            return res.status(403).json({ message: 'Host access only' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const authenticateToken = (req, res, next) => {
    // Add error handling for cookies
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        console.log('No token found in request');
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};