const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const indianNumberRegex = /^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/;
const mobileRegex = /^[6-9]\d{9}$/;
const googleIdRegex = /^\d{21}$/;

export const validateEmail = (email)=>{
    return emailRegex.test(email)
}