import { OTP } from "../models/otp.model.js";
import { sendEmail } from "../utils/mailer.util.js";

export const getOTPWithEmail = async () => {
  return await OTP.findOne({ email }).lean();
};

export const deleteOTP = async id => {
  return await OTP.findByIdAndDelete(id);
};

export const createOTP = async obj => {
  return await OTP.create(obj);
};

export const sendOTPViaEmail = async (email, OTP) => {
  try {
    const mailObj = {
      from: `"Glacier" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "OTP for Authentication",
      html: `
            <span>OTP: ${OTP}</span>
            <p>Use this OTP within 5 minutes</p>
        `
    };

    await sendEmail(mailObj);
  } catch (error) {
    console.error("Error sending OTP via email:", error);
    throw error;
  }
};
