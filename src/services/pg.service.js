import axios from "axios";

const NODE_ENV = process.env.NODE_ENV;
const isProduction = NODE_ENV === "production";

const client_id = isProduction ? process.env.prod_client_id : process.env.uat_client_id;
const client_secret = isProduction ? process.env.prod_client_secret : process.env.uat_client_secret;
const client_version = isProduction ? process.env.prod_client_version : process.env.uat_client_version;
const grant_type = isProduction ? process.env.prod_grant_type : process.env.uat_grant_type;

const auth_url = isProduction ? process.env.prod_auth_url : process.env.uat_auth_url
const base_url = isProduction ? process.env.prod_base_url : process.env.uat_base_url

let phonePeTokenCache = {
    token: null,
    expiry: 0 
};

function savePhonePeToken(tokenData) {
    const { access_token, expires_in = 3600 } = tokenData;

    if (!access_token || typeof access_token !== 'string') {
        throw new Error("Invalid access_token received from PhonePe API");
    }

    console.log("Token to Save:", access_token);

    const now = Math.floor(Date.now() / 1000);
    phonePeTokenCache = {
        token: access_token,
        expiry: now + expires_in - 60 // refresh 60 seconds before expiry
    };
}

async function fetchPhonePeTokenFromAPI() {
    const params = new URLSearchParams();
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('client_version', client_version);
    params.append('grant_type', grant_type);

    const response = await axios.post(auth_url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokenData = response.data;

    console.log("API Response:", tokenData);
    savePhonePeToken(tokenData);
    console.log("PhonePe token refreshed and stored in memory");
}

async function getPhonePeToken() {
    const now = Math.floor(Date.now() / 1000);

    if (!phonePeTokenCache.token || now >= phonePeTokenCache.expiry) {
        console.warn("PhonePe token missing or expired. Fetching a new one...");

        try {
            await fetchPhonePeTokenFromAPI();
        } catch (error) {
            console.error("Failed to fetch PhonePe token:", error.message);
            throw new Error("PhonePe token unavailable");
        }
    }

    console.log({ token: phonePeTokenCache.token });
    return phonePeTokenCache.token;
}



const phonePeApi = axios.create({
    baseURL: base_url,
    timeout: 5000,
})

phonePeApi.interceptors.request.use(async (config) => {
    const token = await getPhonePeToken();

    config.headers["Authorization"] = `O-Bearer ${token}`;

    return config;
})

export { phonePeApi, fetchPhonePeTokenFromAPI }