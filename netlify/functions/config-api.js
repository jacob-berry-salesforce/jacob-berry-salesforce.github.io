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

const validateConfig = (config) => {
    const requiredFields = ['version', 'level', 'powertrain', 'theme', 'color', 'wheels', 'interior', 'optionalEquipment'];
    const isValid = requiredFields.every((field) => field in config);
    const isCorrectType = Array.isArray(config.optionalEquipment);
    return isValid && isCorrectType;
};

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

        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({ sessionId }),
        };
    }

    if (event.httpMethod === 'GET' && path === '/config') {
        // Return the configuration for the given session ID
        const sessionId = event.headers['x-session-id'];
        if (!sessionId) {
            return {
                statusCode: 400,
                headers: defaultHeaders,
                body: JSON.stringify({ error: 'Missing session ID' }),
            };
        }

        const config = userConfigs[sessionId] || { ...defaultConfig };
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({ data: config }),
        };
    }

    if (event.httpMethod === 'POST' && path === '/config') {
        try {
            const sessionId = event.headers['x-session-id'];
            if (!sessionId) {
                return {
                    statusCode: 400,
                    headers: defaultHeaders,
                    body: JSON.stringify({ error: 'Missing session ID' }),
                };
            }

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

    // Method not allowed
    return { statusCode: 405, headers: defaultHeaders, body: 'Method not allowed' };
};
