/* This is the main Javascript file, called into the DOM.
It builds the UI, and coordinates the functionalities with the color calculations.
*/

import ColorManager from './js/colorManager.js';
import * as colorUtils from './js/colorUtils.js';
import { updateContrastStatus } from './js/colorUtils.js';
import { ScalesRow, HarmonicColorRow } from './js/colorPalette.js';
import { uiManager } from './js/uiManager.js';
import { copyTimeouts } from './js/uiManager.js';
import { mapToGamut } from './js/colorUtils.js';

// Basic parameters
let primaryColor;
let secondaryColor;
let rows = [];
let neutralColor;
let swatchCounter = 0;
let hueDif = 179.5;
let scales = 10;
let lightest = 95;
let darkest = 2;
let isSecondaryInputFocused = false;

/* Saving last values */
let lastUserChroma = 100; 
let lastUserLightness = 70; 
let lastPrimaryChroma = 0;
let lastPrimaryLightness = 0;
let initCallCount = 0;

const { Color } = colorUtils;
const colorManager = new ColorManager();

document.addEventListener('DOMContentLoaded', init);

/* Color management */
function setPrimary(color) {
    primaryColor = new colorUtils.Color(color);
    document.documentElement.style.setProperty('--color-primary', primaryColor.toString({format: "srgb"}));
}

function setSecondary(hueDif) {
    const newHue = colorUtils.setHue(primaryColor.lch.h, hueDif);
    const newChroma = calculateChroma(primaryColor.lch.c, hueDif);
    secondaryColor = colorUtils.relateColor(
        primaryColor, 
        100 - primaryColor.lch.l,
        newChroma,
        newHue
    );
    
    updateColorProperties();
    return secondaryColor;
}

function setNeutral(color) {
    neutralColor = colorUtils.relateColor(
        primaryColor,
        colorUtils.setValue(color.lch.l, 1),
        colorUtils.setValue(color.lch.c, 0.05),
        colorUtils.setHue(color.lch.h, hueDif)
    );
}
function defaultHueDif() {
    // This function should return a default hue difference, adjust as necessary
    return 179;  // Example: Returns a default hue difference of 30 degrees
}


function initiateColors() {
    const params = new URLSearchParams(window.location.search);
    
    // Check if the URL contains 'primaryColor' and 'hueDif' query strings
    if (params.has('primaryColor')) {
        const primaryColor = params.get('primaryColor');
        const hueDif = params.get('hueDif') || defaultHueDif();

        // Validate and set the colors from the query string
        if (isValidColor(primaryColor)) {
            setPrimary(primaryColor);
            setSecondary(hueDif);
        } else {
            console.error('Invalid primary color from URL');
        }
    } else {
        // Fallback: Generate random colors if no query parameters are present
        const initialPrimary = colorUtils.generateRandomLCH();
        const initialHueDif = defaultHueDif();

        setPrimary(initialPrimary);
        setSecondary(initialHueDif);
    }

    // Ensure the UI reflects the correct initial state
    updateColorProperties();
}


function updateColorProperties() {
    document.documentElement.style.setProperty('--color-primary', primaryColor.toString({format: "srgb"}));
    document.documentElement.style.setProperty('--color-secondary', secondaryColor.toString({format: "srgb"}));
}

/* Initiation function*/

function init() {
    initCallCount++;
    if (initCallCount > 1) {
        console.warn(`Warning: Init function called ${initCallCount} times!`);
    }
    
    /* Initiation calls: */
    initiateColors(); /* initiating system colors */
    initializeMainColorInput(); /* Main color input field */
    setupSecondaryColorHandlers(); /* secondary color controls*/
    setupHueSelectionControls(); /* hue harmony tabs */
    updateSecondaryColor(); /* secondary color update */
    setNeutral(primaryColor); /* set neutral color base */
    setupThemeSwitch(); /* UI bright/ dark theme switch */

    /* creating the palettes section */
    const palettesSection = document.querySelector('.palettes-section');
    if (!palettesSection) {
        console.error('Palettes section not found');
        return;
    }

    // Ensure initial colors are set in ColorManager
    colorManager.setPrimaryColor(primaryColor);
    colorManager.setSecondaryColor(secondaryColor);

    // Add functionality to secondary color ticker
    uiManager.addColorTickerFunctionality('secondary-color');

    /* UI controls */
    setupColorHandlers();

    /* Setting the color scale and harmony palettes: */
    setupRows();

    // Force an update of UI elements to ensure everything is in sync
    updateUIElements();
     
}

// New function to update UI elements without setting up rows again
function updateUIElementsWithoutSetup() {
    
    // Update CSS variables
    document.documentElement.style.setProperty('--color-primary', primaryColor.to('srgb').toString({format: "hex"}));
    document.documentElement.style.setProperty('--color-secondary', secondaryColor.to('srgb').toString({format: "hex"}));
    
    // Update primary color inputs
    document.getElementById('color-input').value = primaryColor.to('srgb').toString({format: "hex"});
    updateColorPickerAppearance(primaryColor.to('srgb').toString({format: "hex"}));
    
    // Update secondary color display
    updateSecondaryColorDisplay();
    
    // Update UI controls for secondary color
    updateSecondaryColorControls();

    // Update existing rows
    if (rows) {
        rows.forEach((item, index) => {
            if (item.row && typeof item.row.update === 'function') {
                item.row.update(primaryColor, secondaryColor);
            } else {
                console.error(`Row ${index} does not have an update function`);
            }
        });
    }

    // Update contrast status
    updateContrastStatus(primaryColor, secondaryColor);
}

function setupRows() {
    rows = []; // Clear existing rows

    const palettesSection = document.querySelector('.palettes-section');
    if (!palettesSection) {
        console.error('Palettes section not found');
        return;
    }

    // Create ScalesRow instances
    rows.push({ row: ScalesRow.create(primaryColor, { steps: scales }, "Primary scales"), label: "Primary scales" });
    rows.push({ row: ScalesRow.create(secondaryColor, { steps: scales, interpolation: 'quadratic', includeSource: true }, "Secondary scales"), label: "Secondary scales" });
    rows.push({ row: ScalesRow.create(neutralColor, { 
        steps: scales, 
        startPoint: {l: darkest, c: 0, h: primaryColor.lch.h}, 
        endPoint: {l: lightest, c: 0, h: primaryColor.lch.h}, 
        interpolation: 'linear', 
        includeSource: true,
        isNeutral: true,
        neutralChroma: 5
    },"Neutrals"), label: "Neutrals" });

    // Create HarmonicColorRow instances
    rows.push({ 
        row: HarmonicColorRow.create(primaryColor, secondaryColor, {
            steps: 6,
            interpolation: 'linear',
            lightnessEase: 'linear',
            chromaEase: 'linear',
            lightnessRange: 100,
            chromaRange: 132,
            huePath: 'shorter',
            hueOrder: 'auto'
        }),
        label: "Hue range A" 
    });

    rows.push({ 
        row: HarmonicColorRow.create(primaryColor, secondaryColor, {
            steps: 6,
            interpolation: 'quadratic',
            lightnessEase: 'quadratic',
            chromaEase: 'quadratic',
            lightnessRange: 100,
            chromaRange: 132,
            huePath: 'longer',
            hueOrder: 'auto'
        }),
        label: "Hue range B" 
    });

    rows.push({ 
        row: HarmonicColorRow.create(primaryColor, secondaryColor, {
            steps: 6,
            interpolation: 'sineWave',
            lightnessEase: 'cosineWave',
            chromaEase: 'sineWave',
            lightnessRange: 70,
            chromaRange: 132,
            huePath: 'full-circle',  
            hueOrder: 'auto'
        }),
        label: "Full Hue Circumference" 
    });

    // Set up observers and create swatches
    rows.forEach((item, index) => {
        const row = item.row;
        const label = item.label;

        if (typeof row.update === 'function') {
            colorManager.addObserver(row);
        }

        if (typeof row.createSwatches === 'function') {
            let prefix = row instanceof ScalesRow ? 'scalesrow' : 'row';
            const containerId = `${prefix}-${index + 1}`;
            console.log(`Creating swatches for ${label} with container ID: ${containerId}`);
            row.createSwatches(containerId, label);
          
        }

        if (row instanceof ScalesRow) {
            row.isPrimaryBased = index === 0;
        }
    });
}


/** Color controls in the UI: */

function setupColorHandlers() {
    const colorInput = document.getElementById('color-input');
    const colorPicker = document.getElementById('color-picker-primary');

    // Initialize with the current css value of --color-primary
    const initialColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary').trim();
    
    // Convert the initial color to hex format
    const initialHexColor = new colorUtils.Color(initialColor).to('srgb').toString({format: "hex"});
    
    updateColor(initialHexColor);

    // Set up event listeners
    colorInput.addEventListener('input', handlePrimaryColorInput);
    colorPicker.addEventListener('input', handleColorPicker);
    document.addEventListener('keydown', handleKeyDown);
}



/* Handle color input for primary */
function handlePrimaryColorInput(event) {
    let value = event.target.value;

    // Remove non-hexadecimal characters, but allow #
    value = value.replace(/[^#0-9A-Fa-f]/g, '');

    // Ensure the value starts with # if it's not empty
    if (value && !value.startsWith('#')) {
        value = '#' + value;
    }

    // Limit to 7 characters (including #)
    value = value.slice(0, 7);

    // Update the input value
    event.target.value = value;

    // Only update color if we have a valid hex color
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(value)) {
        updateColor(value);
    }
    updatePrimaryColor(value);
}

function handleColorPicker(event) {
    updateColor(event.target.value);
}
/* update primary color value across controls and system values */
function updateColor(value) {
    const colorInput = document.getElementById('color-input');
    const colorPicker = document.getElementById('color-picker-primary');
    // Update input value
    colorInput.value = value;

    // Only proceed with color updates if we have a valid hex color
    if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(value)) {
        // Extend 3-digit hex to 6-digit
        const extendedValue = value.length === 4 ? 
            '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3] : 
            value;

        // Update color picker
        colorPicker.value = extendedValue;

        // Update color picker appearance
        updateColorPickerAppearance(extendedValue);

        // Update color input text color
        updateColorInputTextColor(extendedValue);

        // Update primary color
        updatePrimaryColor(extendedValue);
    }
    
}

/* Update teh color-picker element */
function updateColorPickerAppearance(colorValue) {
    const colorPicker = document.getElementById('color-picker-primary');
    
    // Update the background color of the color picker
    colorPicker.style.backgroundColor = colorValue;
    
    // Calculate contrasting text color (black or white)
    const color = new colorUtils.Color(colorValue);
    const textColor = color.luminance > 0.5 ? '#000000' : '#ffffff';
    
    // Update the text color of the color picker
    colorPicker.style.color = textColor;
}

/* Update primary color value to secondary*/
function updatePrimaryColor(colorValue) {
    try {
        const newPrimaryColor = new Color(colorValue).to('lch');
        
        // Store last primary color values before updating
        lastPrimaryChroma = primaryColor ? primaryColor.lch.c : newPrimaryColor.lch.c;
        lastPrimaryLightness = primaryColor ? primaryColor.lch.l : newPrimaryColor.lch.l;
        
        primaryColor = newPrimaryColor;

        const newSecondaryColor = recalculateSecondaryColor(primaryColor, hueDif, secondaryColor);
        secondaryColor = newSecondaryColor;

        colorManager.setPrimaryColor(primaryColor);
        colorManager.setSecondaryColor(secondaryColor);

        updateUIElements();
        updateAllScalesRows(primaryColor, secondaryColor);
        updateContrastStatus(primaryColor, secondaryColor);

    } catch (error) {
        console.error("Invalid color value:", error);
    }
    updateContrastCheck();
}

function updateUIElements() {

    // Update CSS variables
    document.documentElement.style.setProperty('--color-primary', primaryColor.to('srgb').toString({format: "hex"}));
    document.documentElement.style.setProperty('--color-secondary', secondaryColor.to('srgb').toString({format: "hex"}));
    
    // Update primary color inputs
    document.getElementById('color-input').value = primaryColor.to('srgb').toString({format: "hex"});
    updateColorPickerAppearance(primaryColor.to('srgb').toString({format: "hex"}));
    
    // Update secondary color display
    updateSecondaryColorDisplay();
    
    // Update UI controls for secondary color
    updateSecondaryColorControls();

    
    // Update all rows (both ScalesRow and HarmonicColorRow)
    if (rows) {
        rows.forEach((item, index) => {
            if (item.row && typeof item.row.update === 'function') {
                item.row.update(primaryColor, secondaryColor);
            }
        });
    }

    // Update contrast status
    updateContrastStatus(primaryColor, secondaryColor);

    if (secondaryColor.lch.c === 0) {
        console.warn('Warning: Secondary color chroma is zero');
    }
    
}

// Add this new function to update the UI controls for secondary color
function updateSecondaryColorControls() {
    const chromaSlider = document.getElementById('chroma-slider');
    const chromaInput = document.getElementById('chroma-input');
    const lightnessSlider = document.getElementById('lightness-slider');
    const lightnessInput = document.getElementById('lightness-input');

    if (!chromaSlider || !chromaInput || !lightnessSlider || !lightnessInput) {
        console.error('Secondary color control elements not found');
        return;
    }

    const maxChroma = 132;
    const chroma = Math.round(secondaryColor.lch.c);
    const lightness = Math.round(secondaryColor.lch.l);

    // Only update if the values have changed
    if (parseInt(chromaSlider.value) !== chroma) {
        chromaSlider.value = chroma;
        chromaInput.value = chroma;
    }

    if (parseInt(lightnessSlider.value) !== lightness) {
        lightnessSlider.value = lightness;
        lightnessInput.value = lightness;
    }
    updateContrastCheck();
}

function updateAllScalesRows(primaryColor, secondaryColor) {
    rows.forEach(item => {
        if (item.row instanceof ScalesRow) {
            item.row.update(primaryColor, secondaryColor);
        }
    });
}

function updateColorInputTextColor(colorValue) {
    const colorInput = document.getElementById('color-input');
    const copyIcon = document.getElementById('main-input-copy-to-cb').querySelector('svg path');
    const color = new colorUtils.Color(colorValue);
    
    // Calculate relative luminance
    const luminance = color.luminance;
    
    // Choose text color based on luminance
    // Using Web Content Accessibility Guidelines (WCAG) contrast ratio
    const textColor = luminance > 0.179 ? '#000000' : '#ffffff';
    
    // Update text color and background color
    colorInput.style.color = textColor;
    colorInput.style.backgroundColor = colorValue;
    
    // Directly set the fill color of the SVG path
    copyIcon.setAttribute('fill', textColor);
}


/* Secondary color */

function setupSecondaryColorHandlers() {
    const hueControls = document.querySelectorAll('input[name="colorScheme"]');
    const chromaSlider = document.getElementById('chroma-slider');
    const chromaInput = document.getElementById('chroma-input');
    const lightnessSlider = document.getElementById('lightness-slider');
    const lightnessInput = document.getElementById('lightness-input');

    if (chromaSlider && chromaInput) {
        chromaSlider.max = 132;
        chromaInput.max = 132;

        chromaSlider.addEventListener('input', handleChromaChange);
        chromaInput.addEventListener('input', handleChromaChange);
    } else {
        console.error('Chroma controls not found');
    }
    
    hueControls.forEach(control => {
        control.addEventListener('change', handleHueChange);
    });

    if (lightnessSlider && lightnessInput) {
        lightnessSlider.addEventListener('input', handleLightnessChange);
        lightnessInput.addEventListener('input', handleLightnessChange);
        lightnessInput.addEventListener('change', handleSecondaryLightnessChange); // For when the input loses focus
    } else {
        console.error('Lightness controls not found');
    }

    // Add focus and blur event listeners
    if (chromaInput) {
        chromaInput.addEventListener('focus', handleSecondaryInputFocus);
        chromaInput.addEventListener('blur', handleSecondaryInputBlur);
    }
    if (lightnessInput) {
        lightnessInput.addEventListener('focus', handleSecondaryInputFocus);
        lightnessInput.addEventListener('blur', handleSecondaryInputBlur);
    }

    // Set maximum value for chroma input and slider
    if (chromaInput) chromaInput.max = 132;
    if (chromaSlider) chromaSlider.max = 132;

    // Set range for lightness input and slider
    if (lightnessInput) {
        lightnessInput.min = 0;
        lightnessInput.max = 100;
    }
    if (lightnessSlider) {
        lightnessSlider.min = 0;
        lightnessSlider.max = 100;
    }
}

function handleLightnessChange(event) {
    const lightnessSlider = document.getElementById('lightness-slider');
    const lightnessInput = document.getElementById('lightness-input');

    let newValue = parseInt(event.target.value);
    newValue = Math.min(Math.max(newValue, 0), 100);

    if (event.target === lightnessSlider) {
        lightnessInput.value = newValue;
    } else if (event.target === lightnessInput) {
        lightnessSlider.value = newValue;
    }

    lastUserLightness = newValue;
    updateSecondaryColor();
}

function handleSecondaryLightnessChange(event) {
    const maxLightness = 100;
    lastUserLightness = Math.min(Math.max(parseInt(event.target.value), 0), maxLightness);
    document.getElementById('lightness-slider').value = lastUserLightness;
    document.getElementById('lightness-input').value = lastUserLightness;
    updateSecondaryColor();
}


function handleHueChange(event) {

    switch(event.target.value) {
        case 'complementary': hueDif = 179.5; break; // Maintaining 179.5 for complementary
        case 'triad': hueDif = 120; break;
        case 'quad': hueDif = 60; break;
        case 'analogous': hueDif = 30; break;
    }

    const newSecondaryColor = recalculateSecondaryColor(primaryColor, hueDif, secondaryColor);
    secondaryColor = newSecondaryColor;
    colorManager.setSecondaryColor(secondaryColor);
    updateUIElements();
    updateAllScalesRows(primaryColor, secondaryColor);
}

function calculateChroma(primaryChroma, hueDifference) {
    // This is a simple example. You might want to adjust this based on your specific needs
    const factor = 1 - (hueDifference / 360);
    return primaryChroma * factor;
}


function handleSecondaryInputFocus() {
    isSecondaryInputFocused = true;
}

function handleSecondaryInputBlur() {
    isSecondaryInputFocused = false;
}

function handleChromaChange(event) {
    const maxChroma = 132;
    lastUserChroma = Math.min(Math.max(parseInt(event.target.value), 0), maxChroma);
    document.getElementById('chroma-slider').value = lastUserChroma;
    document.getElementById('chroma-input').value = lastUserChroma;
    updateSecondaryColor();
}


function updateSecondaryColor() {

    if (!primaryColor) {
        return;
    }
    const chromaSlider = document.getElementById('chroma-slider');
    const lightnessSlider = document.getElementById('lightness-slider');
  
    if (!chromaSlider || !lightnessSlider) {
        return;
    }

    const maxChroma = 132;
    const chroma = parseInt(chromaSlider.value);
    const lightness = parseInt(lightnessSlider.value);
    const newSecondaryColor = colorUtils.relateColor(
        primaryColor,
        lightness,
        chroma,  // Use the chroma value directly, without constraining it
        colorUtils.setHue(primaryColor.lch.h, hueDif)
    );

    secondaryColor = newSecondaryColor;
    colorManager.setSecondaryColor(secondaryColor);
    updateUIElements();
    updateAllScalesRows(primaryColor, secondaryColor);
    updateContrastCheck();
}

function updateSecondaryColorManual() {
    updateSecondaryColor();
    colorManager.setSecondaryColor(secondaryColor);
    updateSecondaryColorDisplay();
}

function updateSecondaryColorDisplay() {

    const secondaryColorElement = document.getElementById('secondary-color');
    if (!secondaryColorElement) {
        console.error('Secondary color element not found');
        return;
    }

    if (!secondaryColor) {
        console.error('Secondary color is undefined');
        return;
    }

    let hexColor;
    try {
        hexColor = secondaryColor.to('srgb').toString({format: "hex"});
        // Convert back to LCH to check if chroma is preserved
        const backToLCH = new colorUtils.Color(hexColor).to('lch');
    } catch (error) {
        console.error('Error converting secondary color to hex:', error);
        hexColor = '#000000'; // Fallback to black if conversion fails
    }
    secondaryColorElement.style.backgroundColor = hexColor;
    
    // update hex value display
    let hexValue = secondaryColorElement.querySelector('.hex-value');
    if (!hexValue) {
        hexValue = document.createElement('span');
        hexValue.className = 'hex-value';
        secondaryColorElement.appendChild(hexValue);
    }
    hexValue.textContent = hexColor;
    
    // Set text color based on contrast
    try {
        const textColor = colorUtils.getContrastTextColor(hexColor);
        hexValue.style.color = textColor;

        // Update icon colors
        const copyIcon = secondaryColorElement.querySelector('.copy-icon');
        const checkIcon = secondaryColorElement.querySelector('.check-icon');
        if (copyIcon) copyIcon.style.color = textColor;
        if (checkIcon) checkIcon.style.color = textColor;
    } catch (error) {
        console.error('Error setting contrast text color:', error);
    }
}

function correlateSecondaryColor(primaryColor, hueDif) {
    // Calculate correlated lightness (inverse of primary)
    const correlatedLightness = 100 - primaryColor.lch.l;
    
    // Calculate correlated chroma (same as primary)
    const correlatedChroma = primaryColor.lch.c;
    
    // Calculate new hue
    const correlatedHue = (primaryColor.lch.h + hueDif) % 360;
    
    return {
        l: correlatedLightness,
        c: correlatedChroma,
        h: correlatedHue
    };
}

/* Capture key events on page for primary color value typing */
function handleKeyDown(event) {
    const colorInput = document.getElementById('color-input');
    const validKeys = /^[#0-9A-Fa-f]$/;
    
    if (validKeys.test(event.key) && document.activeElement !== colorInput && !isSecondaryInputFocused) {
        event.preventDefault();
        colorInput.focus();
        
        if (event.key === '#') {
            colorInput.value = '#';
        } else {
            colorInput.value = '#' + event.key;
        }
        
        // Trigger the input event to update the color
        colorInput.dispatchEvent(new Event('input'));
    }
}

/* Setup bright/dark theme switch */
function setupThemeSwitch() {
    const body = document.body;
    const themeCheckbox = document.getElementById('theme-checkbox');

    function setTheme(isDark) {
        body.classList.toggle('main-theme-dark', isDark);
        body.classList.toggle('main-theme-bright', !isDark);
        localStorage.setItem('darkMode', isDark);
    }

    function toggleTheme() {
        const isDark = themeCheckbox.checked;
        setTheme(isDark);
    }

    // Set initial theme
    const savedTheme = localStorage.getItem('darkMode');
    const defaultDark = savedTheme === null ? true : savedTheme === 'true';
    themeCheckbox.checked = defaultDark;
    setTheme(defaultDark);

    // Event listener for checkbox changes
    themeCheckbox.addEventListener('change', toggleTheme);

    // Event listener for Enter key
    themeCheckbox.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.checked = !this.checked;
            toggleTheme();
        }
    });
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupThemeSwitch();
});

document.addEventListener('DOMContentLoaded', setupThemeSwitch);

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupThemeSwitch);

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupThemeSwitch);

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupThemeSwitch);
// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupThemeSwitch);

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', setupThemeSwitch);

/* Setup hue harmony tabs */ 
function setupHueSelectionControls() {
    const labels = document.querySelectorAll('.seg-ctrl label');
    /* Allow keyboard control */
    labels.forEach(label => {
        label.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevent default action for space key
                const radio = document.getElementById(this.getAttribute('for'));
                radio.checked = true;
                radio.dispatchEvent(new Event('change')); // Trigger change event on the radio button
            }
        });
    });
}


function initializeMainColorInput() {
    /* Main color text input field */
    const mainInputCopyBtn = document.getElementById('main-input-copy-to-cb');
    const colorInput = document.getElementById('color-input');

    /* Copy to clipboard functionality */
    if (mainInputCopyBtn && colorInput) {
        mainInputCopyBtn.addEventListener('click', () => {
            const originalValue = colorInput.value;
            navigator.clipboard.writeText(originalValue).then(() => {
                // Clear any existing timeout for this element
                if (copyTimeouts[colorInput.id]) {
                    clearTimeout(copyTimeouts[colorInput.id]);
                }
                // Replace input value with 'Copied!'
                colorInput.value = 'Copied!';
                // Set new timeout
                copyTimeouts[colorInput.id] = setTimeout(() => {
                    colorInput.value = originalValue;
                    delete copyTimeouts[colorInput.id];
                }, 1500);
            });
        });
    } else {
        console.error('Main color input or copy button not found');
    }
}


function recalculateSecondaryColor(primaryColor, hueDif, currentSecondaryColor) {

    const newHue = colorUtils.setHue(primaryColor.lch.h, hueDif);
    
    // Adjust chroma and lightness based on primary color changes
    const chromaRatio = primaryColor.lch.c / lastPrimaryChroma;
    const lightnessRatio = primaryColor.lch.l / lastPrimaryLightness;
    const newChroma = Math.min(Math.max(lastUserChroma * chromaRatio, 1), 132);
    const newLightness = Math.min(Math.max(lastUserLightness * lightnessRatio, 0), 100);
    const newSecondaryColor = colorUtils.relateColor(
        primaryColor,
        newLightness,
        newChroma,
        newHue
    );

    // Update last user values
    lastUserChroma = newChroma;
    lastUserLightness = newLightness;
    return newSecondaryColor;
}

function updateContrastCheck() {
    const primaryColorHex = primaryColor.to('srgb').toString({format: "hex"});
    const secondaryColorHex = secondaryColor.to('srgb').toString({format: "hex"});
    const contrastStatus = colorUtils.updateContrastStatus(primaryColorHex, secondaryColorHex);
    const contrastStatusElement = document.getElementById('contrast-status');
    if (!contrastStatusElement) {
        console.error("Contrast status element not found in the DOM");
        return;
    }
    
    const successIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>';
    const failIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="1rem" viewBox="0 -960 960 960" width="1rem" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>';

    contrastStatusElement.innerHTML = `
        <span class="${contrastStatus.aaLarge ? 'success' : 'fail'}">
            ${contrastStatus.aaLarge ? successIcon : failIcon} AA18
        </span>
        <span class="${contrastStatus.aa ? 'success' : 'fail'}">
            ${contrastStatus.aa ? successIcon : failIcon} AA
        </span>
        <span class="${contrastStatus.aaa ? 'success' : 'fail'}">
            ${contrastStatus.aaa ? successIcon : failIcon} AAA
        </span>
    `;
    contrastStatusElement.setAttribute('title', `Contrast ratio: ${contrastStatus.ratio}`);

}

/* Copying palettes to clipboard */
function extractColorsWithLabels(rowId, label) {
    const colors = [];
    const rowContainer = document.getElementById(rowId);

    if (!rowContainer) {
        console.error(`Row container with ID ${rowId} not found.`);
        return colors;
    }

    // Select all .hex-value spans and use the label for each color
    const hexValueElements = rowContainer.querySelectorAll('.hex-value');
    hexValueElements.forEach((hexElement, index) => {
        const colorValue = hexElement.textContent.trim();
        if (colorValue) {
            const colorLabel = `${label}-color${index + 1}`;
            colors.push({ [colorLabel]: colorValue });
        }
    });

    return colors; // Returns an array of color objects with labels
} 

document.addEventListener('DOMContentLoaded', init);


