require('dotenv').config();

const Pusher = require('pusher');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});


exports.handler = async (event, context) => {
    if (event.httpMethod === 'POST') {
        try {
            // Parse the incoming JSON payload
            const config = JSON.parse(event.body);
            console.log('Received Config from POST request:', config);

            // Validate the payload
            if (!config.level || !config.theme || !config.color || !config.wheels || !config.interior) {
                console.error('Invalid configuration payload:', config);
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Invalid payload: Missing required fields',
                        requiredFields: ['level', 'theme', 'color', 'wheels', 'interior'],
                    }),
                };
            }

            // Trigger a Pusher event to send the config to the frontend
            await pusher.trigger('config-channel', 'update-config', config);
            console.log('Pusher event triggered successfully:', config);

            // Respond with success
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*', // CORS support
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, GET',
                },
                body: JSON.stringify({
                    message: 'Configuration sent to frontend successfully',
                    data: config,
                }),
            };
        } catch (error) {
            console.error('Error processing POST request:', error);

            // Respond with an error
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Failed to process the configuration',
                    error: error.message,
                }),
            };
        }
    }

    if (event.httpMethod === 'GET') {
        // Return a default configuration for testing
        console.log('GET request received: Sending default configuration');
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // CORS support
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, GET',
            },
            body: JSON.stringify({
                message: 'Default configuration',
                data: {
                    level: 'Core',
                    theme: 'Bright',
                    color: 'Vapour Grey',
                    wheels: '21″ 5-multi spoke black diamond cut',
                    interior: 'Charcoal Ventilated nappa leather',
                    optionalEquipment: [],
                },
            }),
        };
    }

    // Respond with 405 Method Not Allowed for unsupported methods
    console.warn(`Unsupported HTTP method: ${event.httpMethod}`);
    return {
        statusCode: 405,
        body: JSON.stringify({
            message: 'Method not allowed',
            allowedMethods: ['POST', 'GET'],
        }),
    };
};
