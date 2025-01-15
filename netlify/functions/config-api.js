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

    // Handle POST request for updates
    if (event.httpMethod === 'POST') {
        try {
            const config = JSON.parse(event.body);
            console.log('Received Config from POST:', config);

            // Validate required fields
            const requiredFields = ['level', 'powertrain', 'theme', 'color', 'wheels', 'interior'];
            const missingFields = requiredFields.filter(field => !config[field]);
            if (missingFields.length > 0) {
                console.error('Invalid configuration payload:', config);
                return response(400, {
                    message: 'Invalid payload: Missing required fields',
                    missingFields,
                });
            }

            // Trigger Pusher event
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

    // Handle GET request (no longer sets defaults)
    if (event.httpMethod === 'GET') {
        console.log('GET request received: No default configuration set by API');
        return response(204, {
            message: 'Default configuration no longer set by API. Defaults are managed on the frontend.',
        });
    }

    // Handle unsupported methods
    console.warn(`Unsupported HTTP method: ${event.httpMethod}`);
    return response(405, {
        message: 'Method not allowed',
        allowedMethods: ['POST', 'GET', 'OPTIONS'],
    });
};
