import { getUserByEmail } from "../services/user.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import { comparePasswords } from "../utils/password.util.js";
import { validateEmail } from "../utils/validate.util.js";

export const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user;
        if (validateEmail(email)) {
            const emailCaseRegex = new RegExp(email, 'i')

            user = await getUserByEmail(emailCaseRegex)
        }

        if (user) {
            if (user?.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'Blocked User',
                    data: null,
                    error: "ACCESS_DENIED"
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid Credentials',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
                data: null,
                error: 'BAD_REQUEST'
            })
        };

        const accessToken = generateAccessToken({ userId: String(user._id), role: user.role })

        const refreshToken = generateRefreshToken({ userId: String(user._id), role: user.role })

        const { password: pwd, ...userInfo } = user;

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { userInfo, accessToken, refreshToken },
            error: null
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}