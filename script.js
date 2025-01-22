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

    // Update the global configuration object
    Object.assign(currentConfig, config);

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

    // **Call the car and interior carousel update functions here**
    updateCarCarousel();
    updateInteriorCarousel();

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
    const requiredFields = ["version", "level", "powertrain", "theme", "color", "wheels", "interior", "optionalEquipment"];
    let isValid = true;

    // Check required fields
    requiredFields.forEach((field) => {
        if (!(field in config)) {
            console.error(`Validation failed: Missing field "${field}"`);
            isValid = false;
        } else if (config[field] === undefined || config[field] === null) {
            console.error(`Validation failed: "${field}" is undefined or null`, config[field]);
            isValid = false;
        }
    });

    // Check optionalEquipment
    if (!Array.isArray(config.optionalEquipment)) {
        console.error("Validation failed: optionalEquipment is not an array", config.optionalEquipment);
        isValid = false;
    }

    // Check version
    if (typeof config.version !== "number" || config.version < 0) {
        console.error("Validation failed: version is not a non-negative number", config.version);
        isValid = false;
    }

    return isValid;
}



function updateConfigInBackend(config) {
    //console.log("Config before validation", config)
    if (!validateConfig(config)) {
        //console.error("Invalid configuration. Skipping backend update:", config);
        return;
    }

    if (isUpdatingBackend) {
        console.log("Backend update already in progress. Skipping...");
        return;
    }
    isUpdatingBackend = true;

    const sanitizedConfig = sanitizeConfig(config);

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

    // Remove spaces from the color name to match file naming convention
    const sanitizedColor = color.replace(/\s+/g, ""); // Removes all spaces
    const sanitizedWheels = wheels.split("″")[0]; // Extract numeric wheel size
    const sanitizedInterior = encodeURIComponent(interior.replace(/\s+/g, "")); // Removes all spaces and encodes special characters

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

function getInteriorImagePaths(interior) {
    const sanitizedInterior = interior
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/\//g, '-') // Replace slashes with hyphens
        .toLowerCase(); // Convert to lowercase

    const basePath = `/Images/Car/Interior/${sanitizedInterior}`;
    return Array.from({ length: 8 }, (_, index) => `${basePath}/interior_${index + 1}.jpeg`);
}



function updateCarCarousel() {
    const { level, color, wheels } = currentConfig;

    // Generate paths for the car images based on the current config
    const wholeCarImages = getImagePaths("wholeCar");
    const wheelImages = getImagePaths("wheels");

    // Get current indices for carousels
    const carCurrentIndex = parseInt(document.getElementById("carousel1")?.getAttribute("data-current-index") || "0", 10);
    const wheelCurrentIndex = parseInt(document.getElementById("carousel2")?.getAttribute("data-current-index") || "0", 10);

    // Update the car and wheel carousels with the new paths, preserving current index
    updateCarousel("carousel1", wholeCarImages, carCurrentIndex);
    updateCarousel("carousel2", wheelImages, wheelCurrentIndex);
}

function updateInteriorCarousel() {
    const { interior } = currentConfig;

    // Generate paths for the interior images based on the current config
    const imagePaths = getInteriorImagePaths(interior);

    // Get current index for interior carousel
    const interiorCurrentIndex = parseInt(document.getElementById("carousel3")?.getAttribute("data-current-index") || "0", 10);

    // Update the interior carousel with the new paths, preserving current index
    updateCarousel("carousel3", imagePaths, interiorCurrentIndex);
}

function updateCarousel(carouselId, images, currentIndex = 0) {
    const carousel = document.getElementById(carouselId);
    if (carousel) {
        const sanitizedIndex = Math.min(currentIndex, images.length - 1); // Ensure index is within bounds
        carousel.src = images[sanitizedIndex]; // Set the image at the current index
        carousel.setAttribute("data-images", JSON.stringify(images)); // Store images for navigation
        carousel.setAttribute("data-current-index", sanitizedIndex); // Set the current index
    } else {
        console.error(`Carousel with ID ${carouselId} not found.`);
    }
}

// Carousel navigation functions
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

    // Handle color-option clicks using event delegation
    document.querySelector(".color-options")?.addEventListener("click", (e) => {
        const colorOption = e.target.closest(".color-option");
        if (!colorOption) return; // Ignore clicks outside .color-option
    
        // Prevent redundant updates if the same color is already selected
        if (currentConfig.color === colorOption.getAttribute("data-color")) {
            console.log("Same color selected. No update required.");
            return;
        }
    
        // Update currentConfig with the selected color
        currentConfig.color = colorOption.getAttribute("data-color");
        console.log("Color changed to:", currentConfig.color);
    
        // Mark the selected color as active
        document.querySelectorAll(".color-option").forEach((el) => el.classList.remove("active"));
        colorOption.classList.add("active");
    
        // Update color details in the UI
        const colorDetails = document.querySelector(".color-details");
        if (colorDetails) {
            const colorName = colorOption.getAttribute("data-color");
            const colorPrice = colorOption.getAttribute("data-price");
            const colorDescription = colorOption.getAttribute("data-description");
    
            colorDetails.querySelector("h3").innerText = colorName || "Unknown Color";
            colorDetails.querySelector(".color-price").innerText = colorPrice || "Unknown Price";
            colorDetails.querySelector(".color-description").innerText = colorDescription || "No description available";
        } else {
            console.error("Error: .color-details element not found in the DOM.");
        }
    
        // Update car carousel and backend
        updateCarCarousel();
        updateConfigInBackend(currentConfig);
    });
    

    document.querySelector(".wheel-options")?.addEventListener("click", (e) => {
        const wheelOption = e.target.closest(".wheel-option");
        if (!wheelOption) return; // Ignore clicks outside .wheel-option
    
        // Prevent redundant updates if the same wheel option is already selected
        if (currentConfig.wheels === wheelOption.getAttribute("data-wheel")) {
            console.log("Same wheels selected. No update required.");
            return;
        }
    
        // Update currentConfig with the selected wheels
        currentConfig.wheels = wheelOption.getAttribute("data-wheel");
        console.log("Wheels changed to:", currentConfig.wheels);
    
        // Mark the selected wheels as active
        document.querySelectorAll(".wheel-option").forEach((el) => el.classList.remove("active"));
        wheelOption.classList.add("active");
    
        // Update wheel details in the UI
        const wheelDetails = document.querySelector(".wheel-details");
        if (wheelDetails) {
            const wheelName = wheelOption.getAttribute("data-wheel");
            const wheelPrice = wheelOption.getAttribute("data-price");
    
            wheelDetails.querySelector("h3").innerText = wheelName || "Unknown Wheels";
            wheelDetails.querySelector("p").innerText = wheelPrice || "Unknown Price";
        } else {
            console.error("Error: .wheel-details element not found in the DOM.");
        }
    
        // Update car carousel and backend
        updateCarCarousel();
        updateConfigInBackend(currentConfig);
    });
    

    document.getElementById("interiorSelector")?.addEventListener("change", (e) => {
        currentConfig.interior = e.target.value.trim();
        console.log("Interior updated:", currentConfig.interior);
        updateInteriorCarousel();
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

document.addEventListener("DOMContentLoaded", () => {
    const configuratorCarousel = document.querySelector(".configurator-carousel");
    const thirdCarousel = document.querySelector(".third-carousel");

    if (configuratorCarousel && thirdCarousel) {
        const adjustHeight = () => {
            const thirdTop = thirdCarousel.getBoundingClientRect().top + window.scrollY;
            const viewportHeight = window.innerHeight;

            // Adjust sticky container height to end just above the third carousel
            configuratorCarousel.style.height = `${thirdTop - viewportHeight + 40}px`;
        };

        window.addEventListener("resize", adjustHeight);
        window.addEventListener("scroll", adjustHeight);

        // Initial adjustment
        adjustHeight();
    }
});


