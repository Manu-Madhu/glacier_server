import axios from "axios";
import { OTP } from '../models/otp.model.js';
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from '../utils/mailer.util.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const sendOTPViaEmail = async (email, OTP) => {
    try {
        const mailObj = {
            from: `"Glacer" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "OTP for Authentication",
            html: `
            <span>OTP: ${OTP}</span>
            <p>Use this OTP within 5 minutes</p>
        `,
        }

        await sendEmail(mailObj)
    } catch (error) {
        console.error('Error sending OTP via email:', error);
        throw error;
    }
};

export const sendOTPViaSMS = async (mobile, OTP) => {
    try {
        const options = {
            method: 'get',
            url: process.env.FAST2SMS_API_URL,
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
                variables_values: OTP,
                route: 'otp',
                numbers: mobile,
            },
            headers: {
                'Cache-Control': 'no-cache',
            },
        };

        await axios(options);
    } catch (error) {
        console.error('Error sending OTP via SMS:', error);
        throw error;
    }
};

export const getOTPWithMobile = async (mobile) => {
    return await OTP.findOne({ mobile }).lean()
}

export const getOTPWithEmail = async (email) => {
    return await OTP.findOne({ email }).lean()
}

export const deleteOTP = async (id) => {
    return await OTP.findByIdAndDelete(id);
}

export const createOTP = async (obj) => {
    return await OTP.create(obj)
}

export const validateOTPWithMobile = async ({ mobile, otp }) => {
    return await OTP.findOne({
        mobile: mobile.trim(),
        otp: otp.trim(),
    });
}

export const validateOTPWithEmail = async ({ email, otp }) => {
    return await OTP.findOne({
        email: email.trim(),
        otp: otp.trim(),
    });
}

export const verifyOTP = async (id) => {
    return await OTP.findByIdAndUpdate(id, {
        $set: { isVerified: true }
    }, { new: true })
}

export const OTPVerificationStatus = async (id) => {
    const otpDoc = await OTP.findById(id)

    if (otpDoc?.isVerified === true) {
        return true;
    }

    return false
}

export const verifyGoogleIdToken = async (idToken) => {
    return await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
}