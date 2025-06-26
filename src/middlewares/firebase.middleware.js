import admin from 'firebase-admin';
import serviceAccount from '../config/firebase-adminsdk-config.js';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (tokens, payload) => {
    try {
        console.log({tokens, payload})
        const response = await admin.messaging().send(payload)
        console.log({fAdminres: response})
        return response;
    } catch (error) {
        console.log(error)
        console.log(error.code)
    }
    
};

export { sendNotification };