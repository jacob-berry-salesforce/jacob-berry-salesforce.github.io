const Pusher = require('pusher');
require('dotenv').config();

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});

const defaultHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow your frontend origin
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

// Store configurations
const userConfigs = {};

const validateConfig = (config) => {
    const requiredFields = ['version', 'level', 'powertrain', 'theme', 'color', 'wheels', 'interior', 'optionalEquipment'];
    const isValid = requiredFields.every((field) => field in config);
    const isCorrectType = Array.isArray(config.optionalEquipment);
    return isValid && isCorrectType;
};

exports.handler = async (event) => {
    try {
        console.log('Function invoked:', {
            method: event.httpMethod,
            path: event.path,
            headers: event.headers,
            body: event.body,
        });

        // Handle preflight requests
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers: defaultHeaders, body: '' };
        }

        const path = event.path.replace(/\/$/, ''); // Remove trailing slash
        const sessionId = event.headers['x-session-id'];
        if (!sessionId) {
            console.error('Missing session ID in request');
            return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: 'Missing session ID' }) };
        }

        // GET request to fetch configuration
        if (event.httpMethod === 'GET' && path.endsWith('/config')) {
            if (!userConfigs[sessionId]) {
                console.error('Invalid or missing session ID:', sessionId);
                return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: 'Invalid or missing session ID' }) };
            }

            userConfigs[sessionId].timestamp = Date.now(); // Refresh session
            return { statusCode: 200, headers: defaultHeaders, body: JSON.stringify({ data: userConfigs[sessionId].config }) };
        }

        // POST request to update configuration
        if (event.httpMethod === 'POST' && path.endsWith('/config')) {
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

            userConfigs[sessionId] = { config: newConfig, timestamp: Date.now() };
            console.log('Updated configuration for session:', { sessionId, config: userConfigs[sessionId].config });

            try {
                await pusher.trigger(`config-channel-${sessionId}`, 'update-config', userConfigs[sessionId].config);
                console.log(`Pusher triggered successfully for session ${sessionId}`);
            } catch (pusherError) {
                console.error('Error triggering Pusher:', pusherError);
                return { statusCode: 500, headers: defaultHeaders, body: JSON.stringify({ error: 'Failed to trigger Pusher', details: pusherError.message }) };
            }

            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Configuration updated successfully', data: userConfigs[sessionId].config }),
            };
        }

        console.warn('Method not allowed or unknown path:', { method: event.httpMethod, path });
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
