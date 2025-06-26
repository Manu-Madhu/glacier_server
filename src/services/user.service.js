import { User } from "../models/user.model.js"

export const getUserByEmail =async()=>{
    return await User.findOne({email}).lean();
}