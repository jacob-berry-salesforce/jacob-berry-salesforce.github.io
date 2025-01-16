// Initialize Pusher
const Pusher = require('pusher');
require('dotenv').config();

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});

// Default headers
const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Global configuration (in-memory storage)
let currentConfig = {
    version: 0, // Tracks the current version of the configuration
    level: "Core",
    powertrain: "T8 AWD Plug-in Hybrid",
    theme: "Bright",
    color: "Vapour Grey",
    wheels: "20″ 5-Multi Spoke Black Diamond Cut",
    interior: "Charcoal Quilted Nordico in Charcoal interior",
    optionalEquipment: [],
};

// Handle API requests
exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: defaultHeaders, body: '' };
    }

    if (event.httpMethod === 'GET') {
        // Serve the current config from memory without broadcasting
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({ data: currentConfig }),
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const newConfig = JSON.parse(event.body);

            // Only update the config and broadcast if the new version is higher
            if (newConfig.version <= currentConfig.version) {
                return {
                    statusCode: 200,
                    headers: defaultHeaders,
                    body: JSON.stringify({ message: 'Outdated update ignored' }),
                };
            }

            // Update the configuration with the new version
            currentConfig = {
                ...currentConfig,
                ...newConfig,
                source: 'API', // Explicitly mark this as an API change
            };

            // Broadcast the updated configuration
            await pusher.trigger('config-channel', 'update-config', currentConfig);

            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Configuration updated from API', data: currentConfig }),
            };
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders,
                body: JSON.stringify({ error: 'Invalid request' }),
            };
        }
    }

    // Catch-all for unsupported methods
    return { statusCode: 405, headers: defaultHeaders, body: 'Method not allowed' };
};
