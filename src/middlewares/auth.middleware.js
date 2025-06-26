import { userRoleList } from "../config/data.js";
import { verifyAccessToken } from "../utils/jwt.util.js";

export const authMiddleware = (req, res, next) => {

    try {
        const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                data: null,
                error: 'UNAUTHORIZED'
            })
        }

        const acccessToken = authHeader.split(' ')[1];

        // if the acccessToken is present 
        const user = verifyAccessToken(acccessToken)
        if (user && userRoleList?.includes(user.role)) {
            req.user = user;
            next();
        }
        else{
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                data: null,
                error: 'UNAUTHORIZED'
            })
        }
    } catch (error) {
        console.log(error)

        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            data: null,
            error: 'UNAUTHORIZED'
        })
    }

};
