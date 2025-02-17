import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Check for JWT secret at startup
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: "Authentication required",
                message: "No authentication token provided"
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: "Invalid authentication",
                message: "Invalid token format"
            });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = await jwt.verify(token, process.env.JWT_SECRET);
            // Add minimal user validation
            if (!decoded.id) {
                throw new Error('Invalid token payload');
            }
            req.user = decoded;
            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                error: "Invalid authentication",
                message: "Token expired or invalid"
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: "Authentication failed",
            message: "Internal server error"
        });
    }
};

export default authMiddleware;