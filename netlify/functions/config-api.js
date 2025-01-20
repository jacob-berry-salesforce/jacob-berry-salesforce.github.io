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
    'Access-Control-Allow-Origin': 'https://jacob-berry-salesforce.github.io', // Allow your frontend origin
    'Access-Control-Allow-Headers': 'Content-Type, x-session-id', // Include x-session-id
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

// Store configurations and session timestamps
const userConfigs = {};
const sessionTimestamps = {};

// TTL mechanism for sessions
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Periodic cleanup of expired sessions
setInterval(() => {
    const now = Date.now();
    Object.keys(sessionTimestamps).forEach((sessionId) => {
        if (now - sessionTimestamps[sessionId] > SESSION_TIMEOUT) {
            delete userConfigs[sessionId];
            delete sessionTimestamps[sessionId];
            console.log(`Session expired and removed: ${sessionId}`);
        }
    });
}, SESSION_TIMEOUT / 2);

const validateConfig = (config) => {
    const requiredFields = ['version', 'level', 'powertrain', 'theme', 'color', 'wheels', 'interior', 'optionalEquipment'];
    const isValid = requiredFields.every((field) => field in config);
    const isCorrectType = Array.isArray(config.optionalEquipment);
    return isValid && isCorrectType;
};

exports.handler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            console.log('Handling OPTIONS request');
            return { statusCode: 200, headers: defaultHeaders, body: '' };
        }
        console.log('HTTP Method:', event.httpMethod, 'Path:', event.path);
        const path = event.path || '';

        if (event.httpMethod === 'GET' && path === '/session') {
            // Generate a new session ID and return it
            const sessionId = uuidv4();
            userConfigs[sessionId] = { ...defaultConfig };
            sessionTimestamps[sessionId] = Date.now();

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
                console.error('Invalid or missing session ID:', { sessionId, userConfigs });
                return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: 'Invalid or missing session ID' }) };
            }

            sessionTimestamps[sessionId] = Date.now();
            return { statusCode: 200, headers: defaultHeaders, body: JSON.stringify({ data: userConfigs[sessionId] }) };
        }

        if (event.httpMethod === 'POST' && path === '/config') {
            const sessionId = event.headers['x-session-id'];
            if (!sessionId || !userConfigs[sessionId]) {
                console.error('Invalid or missing session ID:', { sessionId, userConfigs });
                return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: 'Invalid or missing session ID' }) };
            }

            let newConfig;
            try {
                newConfig = JSON.parse(event.body);
                console.log('Parsed request body:', newConfig);
            } catch (parseError) {
                console.error('Invalid JSON in request body:', parseError);
                return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: 'Invalid JSON in request body' }) };
            }

            if (!validateConfig(newConfig)) {
                console.error('Validation failed for configuration:', newConfig);
                return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: 'Invalid configuration data' }) };
            }

            userConfigs[sessionId] = { ...newConfig, source: 'API' };
            sessionTimestamps[sessionId] = Date.now();

            try {
                await pusher.trigger(`config-channel-${sessionId}`, 'update-config', userConfigs[sessionId]);
                console.log(`Pusher triggered for session ${sessionId}`);
            } catch (pusherError) {
                console.error('Error triggering Pusher:', pusherError);
                throw new Error('Failed to trigger Pusher');
            }

            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Configuration updated successfully', data: userConfigs[sessionId] }),
            };
        }

        return { statusCode: 405, headers: defaultHeaders, body: 'Method not allowed' };

    } catch (error) {
        console.error('Unexpected server error:', {
            message: error.message,
            stack: error.stack,
            event,
        });
        return { statusCode: 500, headers: defaultHeaders, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
    }
};
