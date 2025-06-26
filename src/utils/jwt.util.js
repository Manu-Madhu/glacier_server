import jwt from "jsonwebtoken";

const expiryAccessToken = "1d";
const expiryRefreshToken = "7d";

//Create Access Token;
export const generateAccessToken = (userInfo) => {
    return jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: expiryAccessToken })
}

//Create Refresh Token;
export const generateRefreshToken = (userInfo) => {
    return jwt.sign(userInfo, process.env.REFRESH_TOKEN_SECRET, { expiresIn: expiryRefreshToken })
}


export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
};