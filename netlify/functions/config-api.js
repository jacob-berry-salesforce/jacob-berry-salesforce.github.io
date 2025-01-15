const Pusher = require('pusher');
require('dotenv').config();

// Validate environment variables
function validateEnv() {
    const missingKeys = [];
    if (!process.env.PUSHER_APP_ID) missingKeys.push('PUSHER_APP_ID');
    if (!process.env.PUSHER_KEY) missingKeys.push('PUSHER_KEY');
    if (!process.env.PUSHER_SECRET) missingKeys.push('PUSHER_SECRET');
    if (!process.env.PUSHER_CLUSTER) missingKeys.push('PUSHER_CLUSTER');

    if (missingKeys.length > 0) {
        throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
    }
}
validateEnv();

// Initialize Pusher
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

// Reusable response
const response = (statusCode, body) => ({
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(body),
});

exports.handler = async (event, context) => {
    console.log(`Received ${event.httpMethod} request.`);

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: defaultHeaders,
            body: '',
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const config = JSON.parse(event.body);
            console.log('Received Config from POST:', config);

            if (!config.level || !config.theme || !config.color || !config.wheels || !config.interior) {
                console.error('Invalid configuration payload:', config);
                return response(400, {
                    message: 'Invalid payload: Missing required fields',
                    requiredFields: ['level', 'theme', 'color', 'wheels', 'interior'],
                });
            }

            await pusher.trigger('config-channel', 'update-config', config);
            console.log('Pusher event triggered successfully:', config);

            return response(200, {
                message: 'Configuration sent to frontend successfully',
                data: config,
            });
        } catch (error) {
            console.error('Error processing POST request:', error);
            return response(500, {
                message: 'Failed to process the configuration',
                error: error.message,
            });
        }
    }

    if (event.httpMethod === 'GET') {
        try {
            console.log('GET request received: Sending default configuration');
            return response(200, {
                message: 'Default configuration',
                data: {
                    level: 'Core',
                    color: 'Vapour Grey',
                    theme: 'Bright',
                    wheels: '21″ 5-multi spoke black diamond cut',
                    interior: 'Charcoal Ventilated nappa leather in Charcoal interior',
                    optionalEquipment: [],
                },
            });
        } catch (error) {
            console.error('Error in GET handler:', error);
            return response(500, {
                message: 'Failed to fetch default configuration',
                error: error.message,
            });
        }
    }

    console.warn(`Unsupported HTTP method: ${event.httpMethod}`);
    return response(405, {
        message: 'Method not allowed',
        allowedMethods: ['POST', 'GET', 'OPTIONS'],
    });
};
