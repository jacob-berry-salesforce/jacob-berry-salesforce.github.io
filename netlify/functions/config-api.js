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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

let currentConfig = {
    version: 0,
    level: "Core",
    powertrain: "T8 AWD Plug-in Hybrid",
    theme: "Bright",
    color: "Vapour Grey",
    wheels: "20″ 5-Multi Spoke Black Diamond Cut",
    interior: "Charcoal Quilted Nordico in Charcoal interior",
    optionalEquipment: [],
};

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

    if (!event.headers['x-api-key'] || event.headers['x-api-key'] !== process.env.API_KEY) {
        return { statusCode: 403, headers: defaultHeaders, body: 'Forbidden' };
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
    
            // Check if all required fields are provided
            const missingFields = requiredFields.filter((field) => !(field in newConfig));
            if (missingFields.length > 0) {
                return {
                    statusCode: 400,
                    headers: defaultHeaders,
                    body: JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
                };
            }
    
            // Overwrite the current configuration with the new configuration
            currentConfig = {
                ...newConfig,
                source: 'API', // Mark the source of the change
            };
    
            // Broadcast the updated configuration
            await pusher.trigger('config-channel', 'update-config', currentConfig);
    
            return {
                statusCode: 200,
                headers: defaultHeaders,
                body: JSON.stringify({ message: 'Configuration updated successfully', data: currentConfig }),
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
    
    
    return { statusCode: 405, headers: defaultHeaders, body: 'Method not allowed' };
};
