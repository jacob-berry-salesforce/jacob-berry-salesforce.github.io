const Pusher = require('pusher');
require('dotenv').config();

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});

const { v4: uuidv4 } = require('uuid'); // To generate unique session IDs

const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-session-id',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const defaultConfig = {
    version: 0,
    level: "Core",
    powertrain: "T8 AWD Plug-in Hybrid",
    theme: "Bright",
    color: "Vapour Grey",
    wheels: "20″ 5-Multi Spoke Black Diamond Cut",
    interior: "Charcoal Quilted Nordico in Charcoal interior",
    optionalEquipment: [],
};

// Store configurations by sessionId
const userConfigs = {};

// TTL mechanism for userConfigs
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
    const now = Date.now();
    Object.keys(sessionTimestamps).forEach((sessionId) => {
        if (now - sessionTimestamps[sessionId] > SESSION_TIMEOUT) {
            console.log(`Cleaning up expired session: ${sessionId}`);
            delete userConfigs[sessionId];
            delete sessionTimestamps[sessionId];
        }
    });
}, 60 * 1000); // Run cleanup every 1 minute


const validateConfig = (config) => {
    const requiredFields = ['version', 'level', 'powertrain', 'theme', 'color', 'wheels', 'interior', 'optionalEquipment'];
    const isValid = requiredFields.every((field) => field in config);
    const isCorrectType = Array.isArray(config.optionalEquipment);
    return isValid && isCorrectType;
};

// Cleanup expired sessions
setInterval(() => {
    const now = Date.now();
    Object.keys(sessionTimestamps).forEach((sessionId) => {
        if (now - sessionTimestamps[sessionId] > sessionTTL) {
            delete userConfigs[sessionId];
            delete sessionTimestamps[sessionId];
            console.log(`Session expired and removed: ${sessionId}`);
        }
    });
}, sessionTTL / 2); // Check for expired sessions every 12 hours

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: defaultHeaders, body: '' };
    }

    // Validate API Key
    if (!event.headers['x-api-key'] || event.headers['x-api-key'] !== process.env.API_KEY) {
        console.log('Expected API Key:', process.env.API_KEY);
        console.log('Received API Key:', event.headers['x-api-key']);
        return { statusCode: 403, headers: defaultHeaders, body: 'Forbidden' };
    }

    const path = event.path || '';

    if (event.httpMethod === 'GET' && path === '/session') {
        // Generate a new session ID and return it
        const sessionId = uuidv4();
        userConfigs[sessionId] = { ...defaultConfig }; // Preload the session with the default configuration
        sessionTimestamps[sessionId] = Date.now(); // Track session creation time

        console.log(`New session created: ${sessionId}`);
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({ sessionId }),
        };
    }

    if (event.httpMethod === 'GET' && path === '/config') {
        const sessionId = event.headers['x-session-id'];
        if (!sessionId || !userConfigs[sessionId]) {
            console.log(`Invalid or missing session ID: ${sessionId}`);
            return {
                statusCode: 400,
                headers: defaultHeaders,
                body: JSON.stringify({ error: 'Invalid or missing session ID' }),
            };
        }

        sessionTimestamps[sessionId] = Date.now(); // Refresh session TTL
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({ data: userConfigs[sessionId] }),
        };
    }

    if (event.httpMethod === 'POST' && path === '/config') {
        const sessionId = event.headers['x-session-id'];
        if (!sessionId || !userConfigs[sessionId]) {
            console.log(`Invalid or missing session ID: ${sessionId}`);
            return {
                statusCode: 400,
                headers: defaultHeaders,
                body: JSON.stringify({ error: 'Invalid or missing session ID' }),
            };
        }

        try {
            const newConfig = JSON.parse(event.body);

            // Required fields validation
            const requiredFields = [
                'version',
                'level',
                'powertrain',
                'theme',
                'color',
                'wheels',
                'interior',
                'optionalEquipment',
            ];

            const missingFields = requiredFields.filter((field) => !(field in newConfig));
            if (missingFields.length > 0) {
                return {
                    statusCode: 400,
                    headers: defaultHeaders,
                    body: JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
                };
            }

            // Validate and update session-specific configuration
            if (!validateConfig(newConfig)) {
                return {
                    statusCode: 400,
                    headers: defaultHeaders,
                    body: JSON.stringify({ error: 'Invalid configuration data' }),
                };
            }

            userConfigs[sessionId] = {
                ...newConfig,
                source: 'API', // Mark the source of the change
            };
            sessionTimestamps[sessionId] = Date.now(); // Refresh session TTL

            // Broadcast the updated configuration to the session-specific channel
            await pusher.trigger(`config-channel-${sessionId}`, 'update-config', userConfigs[sessionId]);

            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Configuration updated successfully', data: userConfigs[sessionId] }),
            };
        } catch (error) {
            console.error('Error updating configuration:', error);
            return {
                statusCode: 500,
                headers: defaultHeaders,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            };
        }
    }

    console.log(`Invalid path or method: ${event.httpMethod} ${path}`);
    return { statusCode: 405, headers: defaultHeaders, body: 'Method not allowed' };
};
