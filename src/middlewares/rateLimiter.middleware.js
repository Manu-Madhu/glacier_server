import rateLimit from "express-rate-limit";

export const ratelimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 100,
    keyGenerator: (req, res) => {
        return req?.body?.email || req?.body?.mobile || req?.ip;
    },
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
