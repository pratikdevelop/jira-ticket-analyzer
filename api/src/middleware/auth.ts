// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email?: string;
        // Add other claims you store in JWT
    };
}

/**
 * Protect routes - requires valid JWT token
 */
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Access token is required"
                }
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Invalid token format"
                }
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "JWT_SECRET"
        ) as any;

        req.user = decoded;
        next();
    } catch (error: any) {
        console.error("Auth middleware error:", error.name);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: "TOKEN_EXPIRED",
                    message: "Your session has expired. Please login again."
                }
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid token"
                }
            });
        }

        return res.status(401).json({
            success: false,
            error: {
                code: "AUTHENTICATION_FAILED",
                message: "Authentication failed"
            }
        });
    }
};

/**
 * Optional: Role-based protection (if you add roles later)
 */
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Not authenticated" }
            });
        }

        // Example: if you store role in JWT
        // if (!roles.includes(req.user.role)) {
        //     return res.status(403).json({ success: false, error: "Not authorized" });
        // }

        next();
    };
};