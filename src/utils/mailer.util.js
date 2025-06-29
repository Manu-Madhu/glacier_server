import nodemailer from 'nodemailer';

export const sendEmail = async (mailObj) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    return await transporter.sendMail(mailObj);
};