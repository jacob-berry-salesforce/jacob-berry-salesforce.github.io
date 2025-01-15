let currentConfig = {
    level: "Core",
    powertrain: "T8 AWD Plug-in Hybrid",
    theme: "Bright",
    color: "Vapour Grey",
    wheels: "20″ 5-Multi Spoke Black Diamond Cut",
    interior: "Charcoal Quilted Nordico in Charcoal interior",
    optionalEquipment: [] // Initially empty
};

// Set default in the UI
document.addEventListener("DOMContentLoaded", () => {
    const defaults = {
        level: "Core",
        powertrain: "T8 AWD Plug-in Hybrid",
        theme: "Bright",
        color: "Vapour Grey",
        wheels: "20″ 5-Multi Spoke Black Diamond Cut",
        interior: "Charcoal Quilted Nordico in Charcoal interior",
        optionalEquipment: [] // Defaults to no optional equipment
    };

    // Set Level
    const defaultLevel = document.querySelector(`.option-group[data-group="level"] .option[data-trim="${defaults.level}"]`);
    if (defaultLevel) defaultLevel.classList.add("active");

    // Set Powertrain
    const defaultPowertrain = document.querySelector(`.option-group[data-group="powertrain"] .option`);
    if (defaultPowertrain) defaultPowertrain.classList.add("active");

    // Set Theme
    const defaultTheme = document.querySelector(`.option-group[data-group="theme"] .option[data-theme="${defaults.theme}"]`);
    if (defaultTheme) defaultTheme.classList.add("active");

    // Set Color
    const defaultColor = document.querySelector(`.color-option[data-color="${defaults.color}"]`);
    if (defaultColor) defaultColor.classList.add("active");
    const colorDetails = document.querySelector(".color-details");
    if (colorDetails) {
        colorDetails.querySelector("h3").innerText = defaults.color;
        colorDetails.querySelector(".color-price").innerText = "Standard";
        colorDetails.querySelector(".color-description").innerText = "A subtle and classic grey.";
    }

    // Set Wheels
    const defaultWheels = document.querySelector(`.wheel-option[data-wheel="${defaults.wheels}"]`);
    if (defaultWheels) defaultWheels.classList.add("active");
    const wheelDetails = document.querySelector(".wheel-details");
    if (wheelDetails) {
        wheelDetails.querySelector("h3").innerText = defaults.wheels;
        wheelDetails.querySelector("p").innerText = "Standard";
    }

    // Set Interior
    const defaultInterior = document.querySelector(`.interior-option[data-interior="${defaults.interior}"]`);
    if (defaultInterior) defaultInterior.classList.add("active");
    const interiorDetails = document.querySelector(".interior-details");
    if (interiorDetails) {
        interiorDetails.querySelector("h3").innerText = defaults.interior;
        interiorDetails.querySelector(".interior-price").innerText = "Standard";
        interiorDetails.querySelector(".interior-description").innerText = "A sustainable and comfortable interior.";
    }

    // Attach event listeners for optional equipment buttons
    const parent = document.querySelector(".optional-equipment-section");
    if (parent) {
        parent.addEventListener("click", (event) => {
            if (event.target.classList.contains("add-btn")) {
                toggleAdd(event.target);
            }
        });
    }

    console.log("Defaults initialized in the UI");
});

// ==============================
// Option Selection Handlers
// ==============================

function selectOption(element, groupName) {
    const group = document.querySelector(`.option-group[data-group="${groupName}"]`);
    if (group) {
        group.querySelectorAll(".option").forEach((option) => option.classList.remove("active"));
        element.classList.add("active");
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectColor(element) {
    document.querySelectorAll(".color-option").forEach((option) => option.classList.remove("active"));
    element.classList.add("active");
    const colorDetails = document.querySelector(".color-details");
    if (colorDetails) {
        const colorName = element.getAttribute("data-color");
        const colorPrice = element.getAttribute("data-price");
        const colorDescription = element.getAttribute("data-description");
        colorDetails.querySelector("h3").innerText = colorName;
        colorDetails.querySelector(".color-price").innerText = colorPrice;
        colorDetails.querySelector(".color-description").innerText = colorDescription;
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectWheel(element) {
    document.querySelectorAll(".wheel-option").forEach((option) => option.classList.remove("active"));
    element.classList.add("active");
    const wheelDetails = document.querySelector(".wheel-details");
    if (wheelDetails) {
        const wheelName = element.getAttribute("data-wheel");
        const wheelPrice = element.getAttribute("data-price");
        wheelDetails.querySelector("h3").innerText = wheelName;
        wheelDetails.querySelector("p").innerText = wheelPrice;
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

function selectInterior(element) {
    document.querySelectorAll(".interior-option").forEach((option) => option.classList.remove("active"));
    element.classList.add("active");
    const interiorDetails = document.querySelector(".interior-details");
    if (interiorDetails) {
        const interiorName = element.getAttribute("data-interior");
        const interiorPrice = element.getAttribute("data-price");
        const interiorDescription = element.getAttribute("data-description");
        interiorDetails.querySelector("h3").innerText = interiorName;
        interiorDetails.querySelector(".interior-price").innerText = interiorPrice;
        interiorDetails.querySelector(".interior-description").innerText = interiorDescription;
    }

    // Update the configuration
    const updatedConfig = getCurrentConfigFromUI();
    updateConfigInBackend(updatedConfig);
}

// ==============================
// Toggle Category Functionality
// ==============================

function toggleCategory(button) {
    const category = button.nextElementSibling;
    if (category) {
        category.classList.toggle("active");
        button.classList.toggle("active");
    }
}

// ==============================
// Optional Equipment Functionality
// ==============================

function toggleAdd(button) {
    const equipmentName = button.closest(".equipment-option").querySelector(".equipment-name").innerText;

    if (button.classList.contains("added")) {
        // Remove equipment from config
        button.classList.remove("added");
        button.innerText = "Add";

        // Update optionalEquipment array
        const index = currentConfig.optionalEquipment.indexOf(equipmentName);
        if (index > -1) {
            currentConfig.optionalEquipment.splice(index, 1);
        }
    } else {
        // Add equipment to config
        button.classList.add("added");
        button.innerText = "Added";

        // Update optionalEquipment array
        currentConfig.optionalEquipment.push(equipmentName);
    }

    // Sync the updated config to the backend
    updateConfigInBackend(currentConfig);
}

// ========================
// Utility Functions
// ========================

function getCurrentConfigFromUI() {
    return {
        level: document.querySelector('.option-group[data-group="level"] .option.active .option-name')?.innerText,
        powertrain: document.querySelector('.option-group[data-group="powertrain"] .option.active .option-name')?.innerText,
        theme: document.querySelector('.option-group[data-group="theme"] .option.active .option-name')?.innerText,
        color: document.querySelector(".color-option.active")?.getAttribute("data-color"),
        wheels: document.querySelector(".wheel-option.active")?.getAttribute("data-wheel"),
        interior: document.querySelector('.option-group[data-group="interior"] .option.active .option-name')?.innerText,
        optionalEquipment: Array.from(document.querySelectorAll(".add-btn.added")).map(
            (button) => button.closest(".equipment-option").querySelector(".equipment-name").innerText
        ),
    };
}

function updateConfigInBackend(config) {
    // Add API call or backend sync logic here
}
