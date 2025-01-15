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

// Navigate carousel images
function prevImage(carouselId, carouselNumber) {
    const images = carouselImages[`carousel${carouselNumber}`];
    carouselIndexes[carouselId] =
        (carouselIndexes[carouselId] - 1 + images.length) % images.length;
    updateImage(carouselId, images);
}

function nextImage(carouselId, carouselNumber) {
    const images = carouselImages[`carousel${carouselNumber}`];
    carouselIndexes[carouselId] =
        (carouselIndexes[carouselId] + 1) % images.length;
    updateImage(carouselId, images);
}

// ========================
// Option Selection Handlers
// ========================

function selectOption(element, groupName) {
    const group = document.querySelector(`.option-group[data-group="${groupName}"]`);
    if (group) {
        group.querySelectorAll('.option').forEach(option => option.classList.remove('active'));
        element.classList.add('active');
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function toggleDetails(element) {
    if (element.classList.contains('active')) {
        element.classList.remove('active');
    } else {
        const group = element.closest('.option-group');
        group.querySelectorAll('.option').forEach(option => option.classList.remove('active'));
        element.classList.add('active');
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectColor(element, colorName) {
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
    const colorDetails = document.querySelector('.color-details');
    if (colorDetails) {
        colorDetails.querySelector('h3').innerText = colorName;
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectWheel(element) {
    document.querySelectorAll('.wheel-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
    const selectedWheel = element.getAttribute('data-wheel');
    const wheelDetails = document.querySelector('.wheel-details');
    if (wheelDetails) {
        wheelDetails.querySelector('h3').innerText = selectedWheel;
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

// ===================
// Apply Configuration from JSON
// ===================

function applyConfigFromJSON(config) {
    console.log('Applying Config:', config);

    // Update Level
    document.querySelectorAll('.option-group[data-group="level"] .option').forEach(option => {
        if (option.querySelector('.option-name').innerText === config.level) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    // Update Theme
    document.querySelectorAll('.option-group[data-group="theme"] .option').forEach(option => {
        if (option.querySelector('.option-name').innerText === config.theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    // Update Color
    document.querySelectorAll('.color-option').forEach(option => {
        if (option.getAttribute('title') === config.color) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    // Update Color Details (Name, Description, Price)
    const activeColorOption = document.querySelector(`.color-option[title="${config.color}"]`);
    if (activeColorOption) {
        const colorDetails = document.querySelector('.color-details');
        const colorName = activeColorOption.getAttribute('title');
        const colorPrice = activeColorOption.getAttribute('data-price') || "Standard";
        const colorDescription = activeColorOption.getAttribute('data-description') || "No description available.";
        if (colorDetails) {
            colorDetails.querySelector('h3').innerText = colorName;
            colorDetails.querySelector('.color-price').innerText = colorPrice;
            colorDetails.querySelector('.color-description').innerText = colorDescription;
        }
    }

    // Update Wheels
    document.querySelectorAll('.wheel-option').forEach(option => {
        if (option.getAttribute('data-wheel') === config.wheels) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    // Update Wheel Details
    const activeWheelOption = document.querySelector(`.wheel-option[data-wheel="${config.wheels}"]`);
    if (activeWheelOption) {
        const wheelDetails = document.querySelector('.wheel-details');
        if (wheelDetails) {
            wheelDetails.querySelector('h3').innerText = config.wheels;
            wheelDetails.querySelector('p').innerText =
                config.wheels === "21″ 5-multi spoke black diamond cut" ? "Standard" : "£795";
        }
    }

    // Update Interior
    document.querySelectorAll('.option-group[data-group="interior"] .option').forEach(option => {
        if (option.querySelector('.option-name').innerText === config.interior) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    // Update Optional Equipment
    document.querySelectorAll('.option-group[data-group="optional-equipment"] input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = config.optionalEquipment.includes(checkbox.value);
    });

    // Sync the updated configuration to the backend
    updateConfigInBackend(config);
}

// ===================
// Pusher Setup
// ===================

Pusher.logToConsole = true;

const pusher = new Pusher('4e6d9761c08398dd9b26', {
    cluster: 'eu',
    forceTLS: true,
});

// Subscribe to channel
const channel = pusher.subscribe('config-channel');

// Listen for updates
channel.bind('update-config', function (data) {
    console.log('Received Config:', data);
    applyConfigFromJSON(data);
});

// ===================
// Fetch and Send Configurations
// ===================

function sendConfigToAPI(config) {
    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    })
        .then(response => response.json())
        .then(data => console.log('Configuration sent:', data))
        .catch(error => console.error('Error sending configuration:', error));
}

function fetchDefaultConfig() {
    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api')
        .then(response => response.json())
        .then(data => {
            console.log('Default Config:', data);
            applyConfigFromJSON(data.data);
        })
        .catch(error => console.error('Error fetching default configuration:', error));
}

// ===================
// Initialize UI with Default Config
// ===================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Fetching default configuration...');
    fetchDefaultConfig();
});

// ===================
// Sync UI to Backend
// ===================

function getCurrentConfigFromUI() {
    return {
        level: document.querySelector('.option-group[data-group="level"] .option.active .option-name').innerText,
        theme: document.querySelector('.option-group[data-group="theme"] .option.active .option-name').innerText,
        color: document.querySelector('.color-option.active').getAttribute('title'),
        wheels: document.querySelector('.wheel-option.active').getAttribute('data-wheel'),
        interior: document.querySelector('.option-group[data-group="interior"] .option.active .option-name').innerText,
        optionalEquipment: Array.from(document.querySelectorAll('.equipment-checkbox:checked')).map(cb => cb.value),
    };
}

function updateConfigInBackend(config) {
    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    })
        .then(response => response.json())
        .then(data => console.log('Config synced to backend:', data))
        .catch(error => console.error('Error syncing config:', error));
}
