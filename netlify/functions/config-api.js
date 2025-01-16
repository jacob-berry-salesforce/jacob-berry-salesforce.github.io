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

// Global configuration
let currentConfig = {
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
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: JSON.stringify({ data: currentConfig }),
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const newConfig = JSON.parse(event.body);
            currentConfig = { ...currentConfig, ...newConfig };

            await pusher.trigger('config-channel', 'update-config', currentConfig);

            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Configuration updated', data: currentConfig }),
            };
        } catch (error) {
            return {
                statusCode: 500,
                headers: defaultHeaders,
                body: JSON.stringify({ error: 'Invalid request' }),
            };
        }
    }

    return { statusCode: 405, headers: defaultHeaders, body: 'Method not allowed' };
};
