import { isValidObjectId } from "mongoose";
import { createOTP, deleteOTP, getOTPWithEmail, sendOTPViaEmail } from "../services/auth.service.js";
import { getUserByEmail } from "../services/user.service.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from "../utils/jwt.util.js";
import { comparePasswords } from "../utils/password.util.js";
import { validateEmail } from "../utils/validate.util.js";
import { generateOTP } from "../utils/helper.util.js";

export const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user;
        if (validateEmail(email)) {
            const emailCaseRegex = new RegExp(email, "i");

            user = await getUserByEmail(emailCaseRegex);
        }

        if (user) {
            if (user?.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: "Blocked User",
                    data: null,
                    error: "ACCESS_DENIED"
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials",
                data: null,
                error: "BAD_REQUEST"
            });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
                data: null,
                error: "BAD_REQUEST"
            });
        }

        const accessToken = generateAccessToken({
            userId: String(user._id),
            role: user.role
        });

        const refreshToken = generateRefreshToken({
            userId: String(user._id),
            role: user.role
        });

        const { password: pwd, ...userInfo } = user;

        return res.status(200).json({
            success: true,
            message: "success",
            data: { userInfo, accessToken, refreshToken },
            error: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: "INTERNAL_SERVER_ERROR"
        });
    }
};

export const regenerateTokens = async (req, res) => {
    const  {refreshToken} = req.body;
    try {
        if(typeof refreshToken !== 'string'){
            return res.status(400).json({
                success:false,
                message: "Invalid Token",
                data:null,
                error:"BAD_REQUEST"
            })
        }

        const user = verifyRefreshToken(refreshToken);

        const accessToken = generateAccessToken({userId: user.userId, role: user.role});

        const rt = generateRefreshToken({userId: user.userId, role: user.role});

        return res.status(200).json({
            success:true,
            message:"Success",
            data:{accessToken, refreshToken: rt},
            error: null
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};

export const sendOTPHandler =async (req, res)=>{
    try{
        const {email} = req.body;

        if(!validateEmail(email)){
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                data: null,
                errors: {
                    code: "INVALID_DATA",
                    details: "Invalid Data."
                }
            })
        }

        let otpExisting;
        const otpObj ={};

        if(validateEmail(email)){
            otpObj.email = email;
            otpExisting = await getOTPWithEmail(email)
        }

        // delete existing OTP;
        if (isValidObjectId(otpExisting?._id)) {
            await deleteOTP(otpExisting?._id);
        }

        const OTP = generateOTP();

        if (OTP) {
            otpObj.otp = OTP;
        }

        const otpDoc = await createOTP(otpObj);

        if (!otpDoc?._id) {
            return res.status(500).json({
                success: false,
                message: "Unable to generate OTP",
                data: null,
                error: "INTERNAL_SERVER_ERROR"
            })
        }

        // sent otp to mail using nodemailer
        try {
            if (email) {
                await sendOTPViaEmail(email, OTP)
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            return res.status(500).json({
                success: false,
                message: "Unable to send OTP",
                data: null,
                error: "INTERNAL_SERVER_ERROR"
            })
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: null,
            error: null
        });

    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message: "Internal Server Error",
            data: null,
            error: "INTERNAL_SERVER_ERROR"
        })
    }
}
