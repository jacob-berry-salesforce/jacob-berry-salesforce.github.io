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

// ==============================
// Optional Equipment Functionality
// ==============================

function toggleCategory(button) {
    const parent = button.parentElement;
    const content = parent.querySelector('.optional-equipment, .equipment-options');
    const isActive = content.classList.toggle('active');

    button.classList.toggle('active', isActive);
}

function toggleAdd(button) {
    const isAdded = button.classList.contains("added");

    if (isAdded) {
        // Change back to "Add" state
        button.classList.remove("added");
        button.textContent = "Add";
    } else {
        // Change to "Added" state
        button.classList.add("added");
        button.textContent = "Added";
    }
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

function selectColor(element) {
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('active'));
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

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectWheel(element) {
    document.querySelectorAll('.wheel-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
    const selectedWheel = element.getAttribute('data-wheel');
    const wheelPrice = element.getAttribute('data-price');
    const wheelDetails = document.querySelector('.wheel-details');
    if (wheelDetails) {
        wheelDetails.querySelector('h3').innerText = selectedWheel;
        wheelDetails.querySelector('p').innerText = wheelPrice;
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectInterior(element) {
    document.querySelectorAll('.interior-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
    const interiorName = element.getAttribute('data-interior');
    const interiorPrice = element.getAttribute('data-price');
    const interiorDescription = element.getAttribute('data-description');
    const interiorDetails = document.querySelector('.interior-details');
    if (interiorDetails) {
        interiorDetails.querySelector('h3').innerText = interiorName;
        interiorDetails.querySelector('.interior-price').innerText = interiorPrice;
        interiorDetails.querySelector('.interior-description').innerText = interiorDescription;
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function toggleCategory(button) {
    const category = button.nextElementSibling;
    if (category) {
        category.classList.toggle("active");
        button.classList.toggle("active");
    }
}

function toggleAdd(button) {
    if (button.classList.contains('added')) {
        button.classList.remove('added');
        button.innerText = 'Add';
    } else {
        button.classList.add('added');
        button.innerText = 'Added';
    }

    // Sync the updated config to the backend
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
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

    // Log any missing fields for debugging
    const missingFields = [];
    if (!level) missingFields.push("level");
    if (!powertrain) missingFields.push("powertrain");
    if (!theme) missingFields.push("theme");
    if (!color) missingFields.push("color");
    if (!wheels) missingFields.push("wheels");
    if (!interior) missingFields.push("interior");

    if (missingFields.length > 0) {
        console.error("Missing fields detected:", missingFields);
    }

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
    console.groupCollapsed("%c[Backend Request] Sending configuration to backend", "color: green; font-weight: bold;");
    console.log("Payload:", config);

    fetch('https://jacob-berry-salesforce.netlify.app/.netlify/functions/config-api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Backend error: ${response.statusText}`);
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
            console.groupEnd(); // Close the group
        });
}
