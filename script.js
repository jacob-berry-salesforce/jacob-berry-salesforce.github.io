// Initialize Pusher for real-time updates
const pusher = new Pusher('4e6d9761c08398dd9b26', {
    cluster: 'eu',
});

// Subscribe to the correct channel
const channel = pusher.subscribe('config-channel');

// Listen for the 'update-config' event
channel.bind('update-config', (config) => {
    console.log('Received config update from backend:', config);
    applyConfigToUI(config); // Apply the new configuration to the UI
});

// Default configuration defined in the frontend
let currentConfig = {
    level: "Core",
    powertrain: "T8 AWD Plug-in Hybrid",
    theme: "Bright",
    color: "Vapour Grey",
    wheels: "20″ 5-Multi Spoke Black Diamond Cut",
    interior: "Charcoal Quilted Nordico in Charcoal interior",
    optionalEquipment: [],
};

// Apply the default configuration to the UI on page load
document.addEventListener("DOMContentLoaded", () => {
    applyConfigToUI(currentConfig);
    console.log("Applied default configuration to the UI:", currentConfig);

    // Attach event listeners for dynamic interaction
    setupEventDelegation();
});

// ==============================
// Function to Apply Config to UI
// ==============================

function applyConfigToUI(config) {
    console.groupCollapsed("%c[UI Update] Applying configuration", "color: green; font-weight: bold;");
    console.log("Configuration applied:", config);
    console.groupEnd();

    // Update Level
    document.querySelectorAll('.option-group[data-group="level"] .option').forEach((option) => {
        option.classList.remove('active');
    });
    const levelOption = document.querySelector(`.option-group[data-group="level"] .option[data-trim="${config.level}"]`);
    if (levelOption) levelOption.classList.add('active');

    // Update Theme
    document.querySelectorAll('.option-group[data-group="theme"] .option').forEach((option) => {
        option.classList.remove('active');
    });
    const themeOption = Array.from(document.querySelectorAll('.option-group[data-group="theme"] .option')).find(
        (option) => option.querySelector('.option-name')?.innerText === config.theme
    );
    if (themeOption) themeOption.classList.add('active');

    // Update Color
    document.querySelectorAll('.color-option').forEach((option) => option.classList.remove('active'));
    const colorOption = document.querySelector(`.color-option[data-color="${config.color}"]`);
    if (colorOption) {
        colorOption.classList.add('active');
        const colorDetails = document.querySelector('.color-details');
        if (colorDetails) {
            colorDetails.querySelector('h3').innerText = config.color;
            colorDetails.querySelector('.color-price').innerText = colorOption.getAttribute('data-price') || 'Standard';
            colorDetails.querySelector('.color-description').innerText =
                colorOption.getAttribute('data-description') || 'Description not available';
        }
    }

    // Update Wheels
    document.querySelectorAll('.wheel-option').forEach((option) => option.classList.remove('active'));
    const wheelOption = document.querySelector(`.wheel-option[data-wheel="${config.wheels}"]`);
    if (wheelOption) {
        wheelOption.classList.add('active');
        const wheelDetails = document.querySelector('.wheel-details');
        if (wheelDetails) {
            wheelDetails.querySelector('h3').innerText = config.wheels;
            wheelDetails.querySelector('p').innerText = wheelOption.getAttribute('data-price') || 'Standard';
        }
    }

    // Update Interior
    document.querySelectorAll('.interior-option').forEach((option) => option.classList.remove('active'));
    const interiorOption = document.querySelector(`.interior-option[data-interior="${config.interior}"]`);
    if (interiorOption) {
        interiorOption.classList.add('active');
        const interiorDetails = document.querySelector('.interior-details');
        if (interiorDetails) {
            interiorDetails.querySelector('h3').innerText = config.interior;
            interiorDetails.querySelector('.interior-price').innerText =
                interiorOption.getAttribute('data-price') || 'Standard';
            interiorDetails.querySelector('.interior-description').innerText =
                interiorOption.getAttribute('data-description') || 'Description not available';
        }
    }

    // Update Optional Equipment
    document.querySelectorAll('.add-btn').forEach((button) => {
        button.classList.remove('added');
        button.innerText = 'Add';
    });
    config.optionalEquipment.forEach((equipmentName) => {
        const equipmentButton = Array.from(document.querySelectorAll('.equipment-option')).find((option) =>
            option.querySelector('.equipment-name').innerText === equipmentName
        )?.querySelector('.add-btn');
        if (equipmentButton) {
            equipmentButton.classList.add('added');
            equipmentButton.innerText = 'Added';
        }
    });

    console.log('UI updated with new configuration:', config);
}

// ==============================
// Event Delegation for Dynamic UI
// ==============================

function setupEventDelegation() {
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        // Handle option selection
        if (target.closest('.option')) {
            const option = target.closest('.option');
            const groupName = option.closest('.option-group').getAttribute('data-group');
            selectOption(option, groupName);
        }

        // Handle color selection
        if (target.closest('.color-option')) {
            selectColor(target.closest('.color-option'));
        }

        // Handle wheel selection
        if (target.closest('.wheel-option')) {
            selectWheel(target.closest('.wheel-option'));
        }

        // Handle interior selection
        if (target.closest('.interior-option')) {
            selectInterior(target.closest('.interior-option'));
        }

        // Handle optional equipment buttons
        if (target.classList.contains('add-btn')) {
            toggleAdd(target);
        }

        // Handle collapsible categories
        if (target.classList.contains('collapsible')) {
            toggleCategory(target);
        }
    });
}

// ==============================
// Option Selection Handlers
// ==============================

function selectOption(element, groupName) {
    const group = document.querySelector(`.option-group[data-group="${groupName}"]`);
    if (group) {
        group.querySelectorAll('.option').forEach((option) => option.classList.remove('active'));
        element.classList.add('active');
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectColor(element) {
    document.querySelectorAll('.color-option').forEach((option) => option.classList.remove('active'));
    element.classList.add('active');
    const colorDetails = document.querySelector('.color-details');
    if (colorDetails) {
        const colorName = element.getAttribute('data-color');
        const colorPrice = element.getAttribute('data-price');
        const colorDescription = element.getAttribute('data-description');
        colorDetails.querySelector('h3').innerText = colorName;
        colorDetails.querySelector('.color-price').innerText = colorPrice;
        colorDetails.querySelector('.color-description').innerText = colorDescription;
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectWheel(element) {
    document.querySelectorAll('.wheel-option').forEach((option) => option.classList.remove('active'));
    element.classList.add('active');
    const wheelDetails = document.querySelector('.wheel-details');
    if (wheelDetails) {
        const wheelName = element.getAttribute('data-wheel');
        const wheelPrice = element.getAttribute('data-price');
        wheelDetails.querySelector('h3').innerText = wheelName;
        wheelDetails.querySelector('p').innerText = wheelPrice;
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectInterior(element) {
    document.querySelectorAll('.interior-option').forEach((option) => option.classList.remove('active'));
    element.classList.add('active');
    const interiorDetails = document.querySelector('.interior-details');
    if (interiorDetails) {
        const interiorName = element.getAttribute('data-interior');
        const interiorPrice = element.getAttribute('data-price');
        const interiorDescription = element.getAttribute('data-description');
        interiorDetails.querySelector('h3').innerText = interiorName;
        interiorDetails.querySelector('.interior-price').innerText = interiorPrice;
        interiorDetails.querySelector('.interior-description').innerText = interiorDescription;
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function toggleAdd(button) {
    const equipmentName = button.closest(".equipment-option").querySelector(".equipment-name").innerText;

    if (button.classList.contains("added")) {
        button.classList.remove('added');
        button.innerText = "Add";
        const index = currentConfig.optionalEquipment.indexOf(equipmentName);
        if (index > -1) currentConfig.optionalEquipment.splice(index, 1);
    } else {
        button.classList.add('added');
        button.innerText = "Added";
        currentConfig.optionalEquipment.push(equipmentName);
    }

    updateConfigInBackend(currentConfig);
}

// ========================
// Utility Functions
// ========================

function getCurrentConfigFromUI() {
    const level = document.querySelector('.option-group[data-group="level"] .option.active .option-name')?.innerText || "Core";
    const powertrain = document.querySelector('.option-group[data-group="powertrain"] .option.active .option-name')?.innerText || "T8 AWD Plug-in Hybrid";
    const theme = document.querySelector('.option-group[data-group="theme"] .option.active .option-name')?.innerText || "Bright";
    const color = document.querySelector('.color-option.active')?.getAttribute('data-color') || "Vapour Grey";
    const wheels = document.querySelector('.wheel-option.active')?.getAttribute('data-wheel') || "20″ 5-Multi Spoke Black Diamond Cut";
    const interior = document.querySelector('.interior-option.active')?.getAttribute('data-interior') || "Charcoal Quilted Nordico in Charcoal interior";

    return {
        level,
        powertrain,
        theme,
        color,
        wheels,
        interior,
        optionalEquipment: Array.from(document.querySelectorAll('.add-btn.added')).map(
            (button) => button.closest('.equipment-option').querySelector('.equipment-name').innerText
        ),
    };
}


function updateConfigInBackend(config) {
    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("%c[Backend Response] Success:", "color: green;", data);
        })
        .catch((error) => {
            console.error("%c[Backend Response] Error:", "color: red;", error);
        });
}


// Function to go to the previous image in a carousel
function prevImage(carouselId, carouselGroup) {
    console.log(`prevImage triggered for ${carouselId}, group ${carouselGroup}`);
    const carousel = document.getElementById(carouselId);
    console.log(`Images: ${images}, Current: ${carousel.src}`);
    if (!carousel) return;

    const images = getCarouselImages(carouselGroup);
    const currentIndex = images.indexOf(carousel.src);

    // Calculate the previous index (loop back if needed)
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    carousel.src = images[prevIndex];
}

// Function to go to the next image in a carousel
function nextImage(carouselId, carouselGroup) {
    console.log(`nextImage triggered for ${carouselId}, group ${carouselGroup}`);
    const carousel = document.getElementById(carouselId);
    console.log(`Images: ${images}, Current: ${carousel.src}`);
    if (!carousel) return;

    const images = getCarouselImages(carouselGroup);
    const currentIndex = images.indexOf(carousel.src);

    // Calculate the next index (loop back if needed)
    const nextIndex = (currentIndex + 1) % images.length;
    carousel.src = images[nextIndex];
}

// Helper function to get the list of images for a given carousel group
function getCarouselImages(carouselGroup) {
    const imageGroups = {
        1: [
            'Images/XC90Ultra1-6.jpeg',
            'Images/XC90Ultra2.jpeg',
            'Images/XC90Ultra3.jpeg',
        ],
        2: [
            'Images/XC90UltraWheel1-3.jpeg',
            'Images/XC90UltraWheel2.jpeg',
            'Images/XC90UltraWheel3.jpeg',
        ],
        3: [
            'Images/XC90UltraInterior1-8.jpeg',
            'Images/XC90UltraInterior2.jpeg',
            'Images/XC90UltraInterior3.jpeg',
        ],
    };

    return imageGroups[carouselGroup] || [];
}
