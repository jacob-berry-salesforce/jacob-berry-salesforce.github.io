// =======================
// Carousel Functionality
// =======================

// Carousel Images
const carouselImages = {
    carousel1: [
        "Images/XC90Ultra1-6.jpeg",
        "Images/XC90Ultra2-6.jpeg",
        "Images/XC90Ultra3-6.jpeg",
        "Images/XC90Ultra4-6.jpeg",
        "Images/XC90Ultra5-6.jpeg",
        "Images/XC90Ultra6-6.jpeg"
    ],
    carousel2: [
        "Images/XC90UltraWheel1-3.jpeg",
        "Images/XC90UltraWheel2-3.jpeg",
        "Images/XC90UltraWheel3-3.jpeg"
    ],
    carousel3: [
        "Images/XC90UltraInterior1-8.jpeg",
        "Images/XC90UltraInterior2-8.jpeg",
        "Images/XC90UltraInterior3-8.jpeg",
        "Images/XC90UltraInterior4-8.jpeg",
        "Images/XC90UltraInterior5-8.jpeg",
        "Images/XC90UltraInterior6-8.jpeg",
        "Images/XC90UltraInterior7-8.jpeg",
        "Images/XC90UltraInterior8-8.jpeg"
    ]
};

// Current indexes for carousels
const carouselIndexes = {
    carousel1: 0,
    carousel2: 0,
    carousel3: 0
};

// Update image for a specific carousel
function updateImage(carouselId, images) {
    const imgElement = document.getElementById(carouselId);
    imgElement.src = images[carouselIndexes[carouselId]];
}

// Navigate to the previous image in the carousel
function prevImage(carouselId, carouselNumber) {
    const images = carouselImages[`carousel${carouselNumber}`];
    carouselIndexes[carouselId] =
        (carouselIndexes[carouselId] - 1 + images.length) % images.length;
    updateImage(carouselId, images);
}

// Navigate to the next image in the carousel
function nextImage(carouselId, carouselNumber) {
    const images = carouselImages[`carousel${carouselNumber}`];
    carouselIndexes[carouselId] =
        (carouselIndexes[carouselId] + 1) % images.length;
    updateImage(carouselId, images);
}

// ========================
// Option Selection Handlers
// ========================

// Select an option (e.g., trim level, theme) and set it as active
function selectOption(element, groupName) {
    const group = document.querySelector(`.option-group:has([onclick="selectOption(this, '${groupName}')"])`);
    if (group) {
        group.querySelectorAll('.option').forEach(option => option.classList.remove('active'));
        element.classList.add('active');
    }
}

// Toggle visibility of option details
function toggleDetails(element) {
    if (element.classList.contains('active')) {
        element.classList.remove('active');
    } else {
        const group = element.closest('.option-group');
        group.querySelectorAll('.option').forEach(option => option.classList.remove('active'));
        element.classList.add('active');
    }
}

// ===================
// Color Selection
// ===================

function selectColor(element, colorName, colorPrice, colorDescription) {
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
    const colorDetails = document.querySelector('.color-details');
    if (colorDetails) {
        colorDetails.querySelector('h3').innerText = colorName;
        colorDetails.querySelector('.color-price').innerText = colorPrice;
        colorDetails.querySelector('.color-description').innerText = colorDescription;
    }
}

// ===================
// Wheel Selection
// ===================

function selectWheel(element) {
    document.querySelectorAll('.wheel-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
    const selectedWheel = element.getAttribute('data-wheel');
    const wheelDetails = document.querySelector('.wheel-details');
    if (wheelDetails) {
        wheelDetails.querySelector('h3').innerText = selectedWheel;
        wheelDetails.querySelector('p').innerText =
            selectedWheel === "21″ 5-multi spoke black diamond cut" ? "Standard" : "£795";
    }
}

// ===================
// Apply Configuration from JSON
// ===================

function applyConfigFromJSON(json) {
    try {
        const config = typeof json === "string" ? JSON.parse(json) : json;

        // Update Level (Trim)
        if (config.level) {
            const levelElement = document.querySelector(`.option-group:nth-child(1) .option:has(.option-name:contains('${config.level}'))`);
            if (levelElement) selectOption(levelElement, 'level');
        }

        // Update Theme
        if (config.theme) {
            const themeElement = document.querySelector(`.option-group:nth-child(2) .option:has(.option-name:contains('${config.theme}'))`);
            if (themeElement) toggleDetails(themeElement);
        }

        // Update Color
        if (config.color) {
            const colorElement = document.querySelector(`.color-option[title="${config.color}"]`);
            if (colorElement) {
                selectColor(colorElement, config.color, "Standard", "Color updated.");
            }
        }

        // Update Wheels
        if (config.wheels) {
            const wheelsElement = document.querySelector(`.wheel-option[data-wheel="${config.wheels}"]`);
            if (wheelsElement) selectWheel(wheelsElement);
        }

        // Update Interior
        if (config.interior) {
            const interiorElement = document.querySelector(`.option-group:nth-child(6) .option:has(.option-name:contains('${config.interior}'))`);
            if (interiorElement) toggleDetails(interiorElement);
        }

        // Update Optional Equipment
        if (config.optionalEquipment) {
            document.querySelectorAll('.equipment-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            config.optionalEquipment.forEach(equipment => {
                const checkbox = document.querySelector(`.equipment-checkbox[value="${equipment}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        console.log("Configuration applied successfully!", config);
    } catch (error) {
        console.error("Error parsing JSON or applying config:", error);
        alert("Invalid JSON format. Please check your input.");
    }
}

// Initialize Pusher
const pusher = new Pusher('4e6d9761c08398dd9b26', {
    cluster: 'eu',
});

// Subscribe to the channel
const channel = pusher.subscribe('config-channel');

// Listen for the 'update-config' event
channel.bind('update-config', function (config) {
    console.log('Received Config:', config);

    // Apply the configuration to the frontend
    applyConfigFromJSON(config); // Update the UI with the new configuration
});

// Send configuration to the API
function sendConfigToAPI(config) {
    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Configuration sent successfully:', data);
        })
        .catch((error) => {
            console.error('Error sending configuration:', error);
        });
}

// Fetch default configuration from the API
function fetchDefaultConfig() {
    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api')
        .then((response) => response.json())
        .then((data) => {
            console.log('Default configuration fetched:', data);
            applyConfigFromJSON(data.data); // Apply the configuration to your UI
        })
        .catch((error) => {
            console.error('Error fetching configuration:', error);
        });
}
