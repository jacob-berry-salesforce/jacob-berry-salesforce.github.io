// Initialize Pusher for real-time updates
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('sessionId', sessionId);
    console.log("New sessionId generated and stored:", sessionId);
} else {
    console.log("Existing sessionId retrieved:", sessionId);
}

const pusher = new Pusher('4e6d9761c08398dd9b26', {
    cluster: 'eu',
});

// Subscribe to the correct channel
const channel = pusher.subscribe(`config-channel-${sessionId}`);

// Listen for the 'update-config' event
channel.bind('update-config', (config) => {
    console.log('Received config update from backend:', config);
    applyConfigToUI(config); // Apply the new configuration to the UI
});

// Default configuration defined in the frontend
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


// ==============================
// Function to Apply Config to UI
// ==============================

let lastAppliedVersion = 0; // Tracks the last applied version
let userMakingChanges = false; // Tracks if the user is actively making changes

function applyConfigToUI(config) {
    // Ignore updates during user interaction unless the source is explicitly 'API'
    if (userMakingChanges && config.source !== 'API') {
        console.warn("Ignored backend update during user interaction:", config);
        return;
    }

    // Update the last applied version
    lastAppliedVersion = config.version;

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
    // Normalize interior string for matching
    const normalizedInterior = config.interior.trim().toLowerCase();

    document.querySelectorAll('.interior-option').forEach((option) => {
        option.classList.remove('active');
    });

    const interiorOption = Array.from(document.querySelectorAll('.interior-option')).find(
        (option) => option.getAttribute('data-interior').trim().toLowerCase() === normalizedInterior
    );

    if (interiorOption) {
        interiorOption.classList.add('active');
        const interiorDetails = document.querySelector('.interior-details');
        if (interiorDetails) {
            interiorDetails.querySelector('h3').innerText = interiorOption.getAttribute('data-interior');
            interiorDetails.querySelector('.interior-price').innerText =
                interiorOption.getAttribute('data-price') || 'Standard';
            interiorDetails.querySelector('.interior-description').innerText =
                interiorOption.getAttribute('data-description') || 'Description not available';
        }
    } else {
        console.error("No matching interior option found for:", config.interior);
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

    console.log("UI updated with new configuration:", config);
}

// ==============================
// Utility Functions
// ==============================

function sanitizeConfig(config) {
    return {
        ...config,
        color: config.color.replace(/([a-z])([A-Z])/g, '$1 $2').trim(), // Add space between words if camelCase is present
        interior: config.interior.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])/g, ' $1').trim(), // Add spaces
        wheels: config.wheels.replace(/″/g, '″').trim(), // Ensure proper character for inches
    };
}

let isUpdatingBackend = false;

function validateConfig(config) {
    const requiredFields = ["level", "powertrain", "theme", "color", "wheels", "interior", "optionalEquipment"];
    return requiredFields.every((field) => config[field] && typeof config[field] === "string");
}

function updateConfigInBackend(config) {
    if (!validateConfig(config)) {
        console.error("Invalid configuration. Skipping backend update:", config);
        return;
    }

    if (isUpdatingBackend) {
        console.log("Backend update already in progress. Skipping...");
        return;
    }
    isUpdatingBackend = true;

    const sanitizedConfig = sanitizeConfig(config);

    console.log("Updating Config in the backend:", sessionId);
    console.log("Payload being sent to the backend:", sanitizedConfig); // Debug payload

    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
        },
        body: JSON.stringify(sanitizedConfig),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("%c[Backend Response] Success:", "color: green;", data);
        })
        .catch((error) => {
            console.error("%c[Backend Response] Error:", "color: red;", error);
        })
        .finally(() => {
            isUpdatingBackend = false;
        });
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
            if (typeof selectOption === 'function') {
                selectOption(option, groupName);
            } else {
                console.error('selectOption function is not defined or accessible.');
            }
        }

        // Handle color selection
        if (target.closest('.color-option')) {
            if (typeof selectColor === 'function') {
                selectColor(target.closest('.color-option'));
            } else {
                console.error('selectColor function is not defined or accessible.');
            } 
        }

        // Handle wheel selection
        if (target.closest('.wheel-option')) {
            if (typeof selectWheel === 'function') {
                selectWheel(target.closest('.wheel-option'));
            } else {
                console.error('selectWheel function is not defined or accessible.');
            }
        }

        // Handle interior selection
        if (target.closest('.interior-option')) {
            if (typeof selectInterior === 'function') {
                selectInterior(target.closest('.interior-option'));
            } else {
                console.error('selectInterior function is not defined or accessible.');
            }
        }

        // Handle optional equipment buttons
        if (target.classList.contains('add-btn')) {
            if (typeof toggleAdd === 'function') {
                toggleAdd(target);
            } else {
                console.error('toggleAdd function is not defined or accessible.');
            }
        }

        // Handle collapsible categories
        if (target.classList.contains('collapsible')) {
            if (typeof toggleCategory === 'function') {
                toggleCategory(target);
            } else {
                console.error('toggleCategory function is not defined or accessible.');
            }
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

function getCurrentConfigFromUI() {
    const level = document.querySelector('.option-group[data-group="level"] .option.active .option-name')?.innerText || "Core";
    const powertrain = document.querySelector('.option-group[data-group="powertrain"] .option.active .option-name')?.innerText || "T8 AWD Plug-in Hybrid";
    const theme = document.querySelector('.option-group[data-group="theme"] .option.active .option-name')?.innerText || "Bright";
    const color = document.querySelector('.color-option.active')?.getAttribute('data-color') || "Vapour Grey";
    const wheels = document.querySelector('.wheel-option.active')?.getAttribute('data-wheel') || "20″ 5-Multi Spoke Black Diamond Cut";
    const interior = document.querySelector('.interior-option.active')?.getAttribute('data-interior') || "Charcoal Quilted Nordico in Charcoal interior";

    // Ensure `version` is carried over from `currentConfig`
    return {
        version: currentConfig.version, // Include the version explicitly
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



// Function to generate image paths based on current configuration
function getImagePaths(type) {
    const { level, color, wheels, interior } = currentConfig;

    const sanitizedColor = color.replace(/ /g, "");
    const sanitizedWheels = wheels.split("″")[0]; // Extract numeric wheel size
    const sanitizedInterior = encodeURIComponent(interior.replace(/ /g, ""));

    let basePath = `/Images/Car/${level}/${sanitizedColor}/${sanitizedWheels}`;
    if (type === "wheels") {
        basePath += `/wheel`;
    } else if (type === "wholeCar") {
        basePath += `/wholeCar`;
    } else if (type === "interior") {
        basePath = `/Images/Interior/${sanitizedInterior}`;
    }

    const numImages = type === "wholeCar" ? 6 : type === "wheels" ? 3 : 8;
    return Array.from({ length: numImages }, (_, index) => `${basePath}_${index + 1}.jpeg`);
}






function updateCarCarousel() {
    const { level, color, wheels } = currentConfig;

    // Get sanitized file paths for the whole car and wheels
    const wholeCarImages = getImagePaths("wholeCar");
    const wheelImages = getImagePaths("wheels"); // Singular wheel

    // Use the first images as defaults
    const defaultWholeCarImage = wholeCarImages[0] || "placeholder_car_image.jpeg";
    const defaultWheelImage = wheelImages[0] || "placeholder_wheel_image.jpeg";

    // Update the carousels
    updateCarousel("carousel1", wholeCarImages, defaultWholeCarImage);
    updateCarousel("carousel2", wheelImages, defaultWheelImage);
}




function updateInteriorCarousel() {
    const { interior } = currentConfig;

    // Sanitize the interior string to remove spaces and special characters
    const sanitizedInterior = interior.replace(/ /g, "");

    // Construct the base path for interior images
    const basePath = `/Images/Interior/${sanitizedInterior}`;
    const interiorImages = Array.from(
        { length: 8 }, // Always 8 interior images
        (_, index) => `${basePath}/interior_${index + 1}.jpeg`
    );

    // Default to the first interior image
    const defaultInteriorImage = interiorImages[0] || "placeholder_interior_image.jpeg";
    updateCarousel("carousel3", interiorImages, defaultInteriorImage);
}




function updateCarousel(carouselId, images, defaultImage) {
    const carousel = document.getElementById(carouselId);
    if (carousel) {
        carousel.src = defaultImage; // Set the first image as default
        carousel.setAttribute("data-images", JSON.stringify(images)); // Store images for navigation
        carousel.setAttribute("data-current-index", "0"); // Reset the current index
    } else {
        console.error(`Carousel with ID ${carouselId} not found.`);
    }
}




// Functions for carousel navigation
function prevImage(carouselId) {
    const carousel = document.getElementById(carouselId);
    const images = JSON.parse(carousel.getAttribute("data-images") || "[]");
    if (images.length === 0) return;

    const currentIndex = parseInt(carousel.getAttribute("data-current-index") || "0", 10);
    const newIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;

    carousel.src = images[newIndex];
    carousel.setAttribute("data-current-index", newIndex);
}

function nextImage(carouselId) {
    const carousel = document.getElementById(carouselId);
    const images = JSON.parse(carousel.getAttribute("data-images") || "[]");
    if (images.length === 0) return;

    const currentIndex = parseInt(carousel.getAttribute("data-current-index") || "0", 10);
    const newIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;

    carousel.src = images[newIndex];
    carousel.setAttribute("data-current-index", newIndex);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing application...");

    // Apply the default configuration and update carousels
    applyConfigToUI(currentConfig);
    updateCarCarousel();
    updateInteriorCarousel();

    // Add event listeners for user interactions
    document.getElementById("colorSelector")?.addEventListener("change", (e) => {
        currentConfig.color = e.target.value.trim(); // Ensure proper formatting
        updateCarCarousel();
        updateConfigInBackend(currentConfig);
    });
    
    document.getElementById("interiorSelector")?.addEventListener("change", (e) => {
        currentConfig.interior = e.target.value.trim();
        updateInteriorCarousel();
        updateConfigInBackend(currentConfig);
    });
    
    document.getElementById("wheelSizeSelector")?.addEventListener("change", (e) => {
        currentConfig.wheels = `${e.target.value}″ ${currentConfig.wheels.split(" ").slice(1).join(" ")}`; // Ensure inch character
        updateCarCarousel();
        updateConfigInBackend(currentConfig);
    });
    
    document.getElementById("trimSelector")?.addEventListener("change", (e) => {
        currentConfig.level = e.target.value.trim();
        updateCarCarousel();
        updateConfigInBackend(currentConfig);
    });
    

    // Attach carousel navigation handlers
    document.getElementById("prev-carousel1")?.addEventListener("click", () => prevImage("carousel1"));
    document.getElementById("next-carousel1")?.addEventListener("click", () => nextImage("carousel1"));
    document.getElementById("prev-carousel2")?.addEventListener("click", () => prevImage("carousel2"));
    document.getElementById("next-carousel2")?.addEventListener("click", () => nextImage("carousel2"));
    document.getElementById("prev-carousel3")?.addEventListener("click", () => prevImage("carousel3"));
    document.getElementById("next-carousel3")?.addEventListener("click", () => nextImage("carousel3"));
});


