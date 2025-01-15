exports.handler = async (event, context) => {
    if (event.httpMethod === 'POST') {
        // Parse the JSON data from the request body
        try {
            const config = JSON.parse(event.body);
            console.log('Received Config:', config); // Log the received configuration

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Configuration received successfully',
                    data: config, // Echo back the received config
                }),
            };
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid JSON format',
                    error: error.message,
                }),
            };
        }
    }

    if (event.httpMethod === 'GET') {
        // Respond with the default configuration
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Default configuration',
                data: {
                    level: 'Ultra',
                    theme: 'Dark',
                    color: 'Onyx Black',
                    wheels: '22″ 7-double spoke black diamond cut',
                    interior: 'Charcoal Ventilated nappa leather',
                    optionalEquipment: ['Heated Steering Wheel', 'Panoramic Roof'],
                },
            }),
        };
    }

    // Handle unsupported HTTP methods
    return {
        statusCode: 405,
        body: JSON.stringify({
            message: 'Method not allowed',
        }),
    };
};
