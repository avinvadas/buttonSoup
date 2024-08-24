/**
* This file holds the functionality for buttonSoup UI. 
* buttonSoup generates full-scale color-systems from a single color, based on a relative color calculations done in CSS.
* The color system logic itself is static and CSS only (colorSystem.css), not a part of the javascript. 
* You can see buttonSoup live at: 
* https://buttonsoup.xyz
* The github repository at:
* https://github.com/avinvadas/buttonSoup
* Copy the color system from the following Gist:
* https://gist.github.com/avinvadas/226b0c93417f0a28ce8c51f854ab3387
* And play with live implementation here:
* https://jsfiddle.net/avinvadas/t1cfs0bv/234/
**/

/*global vars*/
const root = document.documentElement;
const colorInput_wrapper = document.getElementsByClassName('wrapper-primary-color')[0];
const colorInput = document.getElementById("color-input");
const colorInput_copyToCB = document.getElementById("main-input-copy-to-cb");
const colorPicker = document.getElementById("color-picker-primary");
const saturationSlider = document.getElementById("saturation-slider");
const saturationInput = document.getElementById("saturation-input");
const lightnessSlider = document.getElementById("lightness-slider");
const lightnessInput = document.getElementById("lightness-input");
var currentPrimaryColor = getComputedStyle(root).getPropertyValue('--color-primary');
var currentSecondaryColor = getComputedStyle(root).getPropertyValue('--color-secondary');
const neutral_saturation_level = getComputedStyle(root).getPropertyValue('--saturation-factor');


/* Setting color ticker objects: Showing hexes, click to copy, etc */

function presentColorValues(className) { /* Display hexes on DOM elements */
  var sampElements = document.getElementsByClassName(className);
  for (var i = 0; i < sampElements.length; i++) {
    setHex(sampElements[i]);
    setClickToCopy(sampElements[i]);
  }
}
/*initiate copy Hex on click*/
function setClickToCopy(domElement) {
  domElement.addEventListener("click", function () {
    copyTextToClipboard(domElement.hex);
    domElement.innerHTML = '<span class="ticker-hex">✓ Copied</span>' + icon_copy;
    domElement.style.color = getContrastColor(domElement.hex);

    // Display the indication for 2 seconds
    setTimeout(function () {
      domElement.innerHTML = '<span class="ticker-hex">' + domElement.hex + '</span>' + icon_copy;
    }, 1250);
  });
}

/*set Hex for single DOM element*/
function setHex(domElement) {
  var style = window.getComputedStyle(domElement);
  var bgColorRGB = style.getPropertyValue('background-color');
  const hexColor = extractRGBandConvertToHex(bgColorRGB);
  const textColor = getContrastColor(hexColor); // Get contrast color
  domElement.hex = hexColor;
  domElement.innerHTML = `<span class="ticker-hex" style="color: ${textColor};">${domElement.hex}</span><span class="icon-copy" style="color: ${textColor};">${icon_copy}</span>`;
}

/* Copy Single hex: */ 
function copyTextToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  } else {
    // Fallback for older browsers
    const dummyElement = document.createElement("textarea");
    document.body.appendChild(dummyElement);
    dummyElement.value = text;
    dummyElement.select();
    document.execCommand("copy");
    document.body.removeChild(dummyElement);
  }
}
/*Copy entire palette: */
function copyPaletteToClipboard(palette) {
  const paletteSelector = `.palette-${palette}`;
  const paletteElement = document.querySelector(paletteSelector);
  
  if (!paletteElement) { // If the palette not found
    console.error('Palette not found:', palette);
    return; 
  }
  const colorTickers = paletteElement.getElementsByClassName("color-ticker");
  const colors = {};

  Array.from(colorTickers).forEach((ticker, index) => {
    const style = window.getComputedStyle(ticker);
    const bgColor = style.getPropertyValue('background-color');
    const hexColor = extractRGBandConvertToHex(bgColor);
    colors[`Color${index + 1}`] = hexColor;
  });

  const colorsJson = JSON.stringify(colors, null, 2);
  copyTextToClipboard(colorsJson);

  // Change the button label to "Copied to Clipboard!"
  const button = document.querySelector(`button[onclick="copyPaletteToClipboard('${palette}')"]`);
  const originalLabel = button.innerHTML;
  button.innerHTML = "<svg title='icon copy' viewBox='0 0 448 512'><path fill='currentColor' d='M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z'></path></svg>"
    + "Copied to Clipboard!";

  // Change back the button label after 2 seconds
  setTimeout(() => {
    button.innerHTML = originalLabel;
  }, 2000);
}

/* Initiation */ 
function init() {
  document.documentElement.style.setProperty('--color-primary-hex', getRandomHexColor())
  presentColorValues('color-ticker');
  setInput();
  setColorPicker();
  setSliders();
  alignInputsToHex();
  checkInputContrast();
  setInputAutoFocus("color-input");
  updateSecondary();
}

/* Color manipulation inputs */
function setInput() {
  colorInput.addEventListener("input", function () {
    colorPicker.value = colorInput.value;
    var hexColor = colorInput.value;
    document.documentElement.style.setProperty('--color-primary-hex', hexColor);
    document.documentElement.style.setProperty('--input-sec-s', hexToHSL(hexColor, 's'));
    document.documentElement.style.setProperty('--input-sec-l', hexToHSL(hexColor, 'l'));
    currentPrimaryColor =  colorInput.value;
    presentColorValues('color-ticker');
    checkInputContrast();
    alignInputsToHex();
    updateSecondary_Sliders();
    validateInputHex();
  });
  
  const mainInput_copyToCB = document.getElementById('main-input-copy-to-cb');
  mainInput_copyToCB.addEventListener("click", function () {
    copyTextToClipboard(colorInput.value);
    copyFeedback_mainInput()
  });

  function copyFeedback_mainInput() {
    const originalContent = colorInput.value; // Store the existing content
    colorInput.value = '✓ Copied';
    setTimeout(function () {
      colorInput.value = originalContent; // Restore original content
    }, 1250);
  }
}

function setColorPicker() {
  // Update color input value when color picker changes
  colorPicker.addEventListener("input", function () {
    colorInput.value = colorPicker.value;
    const hexColor = colorInput.value;
    // Update CSS variables to reflect the new primary color
    document.documentElement.style.setProperty('--color-primary-hex', hexColor);
    document.documentElement.style.setProperty('--input-sec-s', hexToHSL(hexColor, 's'));
    document.documentElement.style.setProperty('--input-sec-l', hexToHSL(hexColor, 'l'));
    presentColorValues('color-ticker');
    checkInputContrast();
    alignInputsToHex();
    updateSecondary();
    updateSecondary_Sliders();
    validateInputHex();
  });
}

function setSliders() {
  /*Map sliders and inputs to vars*/
  const saturationSlider = document.getElementById("saturation-slider");
  const saturationInput = document.getElementById("saturation-input");
  const lightnessSlider = document.getElementById("lightness-slider");
  const lightnessInput = document.getElementById("lightness-input");
  /* sync each slider and numerical input with one another: */
  syncInputs(saturationSlider, saturationInput);
  syncInputs(lightnessSlider, lightnessInput);
  /* Sync sliders range and number inputs */
  saturationSlider.addEventListener("input", updateSecondary);
  saturationInput.addEventListener("input", updateSecondary);
  lightnessSlider.addEventListener("input", updateSecondary);
  lightnessInput.addEventListener("input", updateSecondary);
  saturationSlider.value = getComputedStyle(root).getPropertyValue('--ratio-sec-s');
  saturationInput.value = saturationSlider.value;
  lightnessSlider.value = getComputedStyle(root).getPropertyValue('--ratio-sec-l');
  lightnessInput.value = lightnessSlider.value;
}

function syncInputs(rangeInput, numberInput) {
  rangeInput.addEventListener('input', function () {
    numberInput.value = rangeInput.value;
  });
  numberInput.addEventListener('input', function () {
    const parsedValue = parseInt(numberInput.value);
    if (parsedValue >= parseInt(numberInput.min) && parsedValue <= parseInt(numberInput.max)) {
      rangeInput.value = parsedValue;
    }
  });
}
/* update secondary color value */
const updateSecondary = () => {
  const s = saturationSlider.value;
  const l = lightnessSlider.value;
  document.documentElement.style.setProperty('--ratio-sec-s', s);
  document.documentElement.style.setProperty('--ratio-sec-l', l);
  var primaryHex = colorInput.value;
  var secondaryHex = getSecondaryHex();
  presentColorValues('color-ticker');
  alignInputsToHex();
  presentWCAG_status(getContrastLevel(primaryHex ,secondaryHex ));
};

function updateSecondary_Sliders() {
  saturationSlider.value = getComputedStyle(root).getPropertyValue('--input-sec-s');
  saturationInput.value = getComputedStyle(root).getPropertyValue('--input-sec-s');
  lightnessSlider.value = getComputedStyle(root).getPropertyValue('--input-sec-l');
  lightnessInput.value = getComputedStyle(root).getPropertyValue('--input-sec-l');
}

function alignInputsToHex() {
  const currentPrimaryColor = getComputedStyle(root).getPropertyValue('--color-primary-hex').trim();
  colorInput.value = currentPrimaryColor;
  colorPicker.value = currentPrimaryColor;
}

/* Extract RGB Values and convert them to hex */
function extractRGBandConvertToHex(colorString) {
  let r = 0, g = 0, b = 0; /* Initialize RGB values */
  let isValidRGB = false; /* Validate RGB values */

  // Check for color format (srgb ...)
  const srgbMatch = colorString.match(/color\(srgb\s+([0-1]\.\d+|[01])\s+([0-1]\.\d+|[01])\s+([0-1]\.\d+|[01])\)/);
  if (srgbMatch) {
    r = Math.round(parseFloat(srgbMatch[1]) * 255);
    g = Math.round(parseFloat(srgbMatch[2]) * 255);
    b = Math.round(parseFloat(srgbMatch[3]) * 255);
    isValidRGB = true;
  } else {
    // Extract RGB or RGBA values if not srgb
    const rgbMatch = colorString.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d\.]+))?\)/);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);

      // Ensure R, G, and B are valid color values (0-255)
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        isValidRGB = true; // Only mark as valid if within range
      }
    }
  }

  // Warn if RGB values are not valid
  if (!isValidRGB) {
    console.warn('Invalid RGB/RGBA value provided: returning #000000');
    return '#000000'; // Default to black
  }

  // Convert to hex
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
  return hex;
}
/*Check input contrast for text*/
function hexToRgb(hex) {
  hex = hex.replace(/^#/, ''); /* Remove hash */

  // Expand shorthand hex ( #03F becomes #0033FF)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Ensure the hex string is exactly 6 characters long
  if (hex.length !== 6) {
    console.error('Invalid hex color:', hex);
    return undefined;
  }

  // Parse the r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Check if the parsing was successful
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.error('Failed to parse RGB values from hex:', hex);
    return undefined;
  }

  // Return as an array
  return [r, g, b];
}


function calculateBrightness(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0; // Fallback if the conversion fails
  const [r, g, b] = rgb;
  // Calculate relative luminance
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Y / 255;  // Normalize by dividing by 255
}

function getContrastColor(hex) {
  hex = hex.replace('#', '');
  const brightness = calculateBrightness(hex);
  return brightness > 0.6 ? '#000000' : '#ffffff';
}

// Example Usage
function checkInputContrast() {
  var hexColor = colorInput.value;
  var textColor = getContrastColor(hexColor);
  colorInput_wrapper.style.color = textColor;
  colorInput.style.color = textColor;
  colorInput_copyToCB.style.color = textColor;
}

/* Color theme selection modes*/
const colorSchemeSelector = document.querySelectorAll('input[name="colorScheme"]');
let selectedColorScheme;
colorSchemeSelector.forEach((radio) => {
  radio.addEventListener('change', function () {
    selectedColorScheme = this.value;
    // Call a function to generate the secondary color based on the selected color scheme
    generateSecondaryColor(selectedColorScheme);
    updateSecondary();
  });
});

function generateSecondaryColor(colorScheme) {
  if (colorScheme == "complementary") {
    document.documentElement.style.setProperty('--hue-dif', 180);
  } else if (colorScheme == "triad") {
    document.documentElement.style.setProperty('--hue-dif', 120);
  } else if (colorScheme == "quad") {
    document.documentElement.style.setProperty('--hue-dif', 90);
  } else if (colorScheme == "analogous") {
    document.documentElement.style.setProperty('--hue-dif', 45);
  }
}
/* Add or remove chroma from Neutral scales */ 
function update_Neutral_Saturation() {
  const chromaToggle = document.getElementById("switchChroma").querySelector('input[type="checkbox"]');
  const chromaToggle__label = document.getElementById("chroma-toggle-label");
  const root = document.documentElement;
  if (chromaToggle.checked) {
    root.style.setProperty('--saturation-factor', neutral_saturation_level);
    chromaToggle__label.innerHTML = "Chroma on";
  } else {
    root.style.setProperty('--saturation-factor', 0);
    chromaToggle__label.innerHTML = "Chroma off";
  }
  presentColorValues('color-ticker');
  alignInputsToHex();
}

function themeSwitch() {
  var element = document.body;
  element.classList.toggle("main-theme-dark");
}
/* Generate a random hex color */
function getRandomHexColor() {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`; // Ensure that the hex is always 6 characters
}

/* Color-space conversion: Hex to HSL */
function hexToHSL(hex, component) {
  let r = 0, g = 0, b = 0;

  // Remove the '#' and parse RGB
  if (hex.length === 4) { // #RGB format
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { // #RRGGBB format
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  // Convert RGB to [0, 1] range
  r /= 255;
  g /= 255;
  b /= 255;

  // Get max and min RGB values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6; // Normalize to [0, 1]
  }

  // Convert h, s, l to appropriate scales
  h = Math.round(h * 360); // Hue [0, 360]
  s = Math.round(s * 100); // Saturation [0, 100]
  l = Math.round(l * 100); // Lightness [0, 100]

  // Return desired component
  switch (component) {
    case 'h':
      return h;
    case 's':
      return s;
    case 'l':
      return l;
    default:
      throw new Error('Invalid component requested. Use "h", "s", or "l".');
  }
}
/*Check for hex validation*/ 
function isValidHex(hex) {
  const hexPattern = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  return hexPattern.test(hex);
}

/* Manage auto-focus on key press for Primary Color input:
* Users should be able to freely type primary hex upon key event by default, and automatically focus on the primary color input, 
* unlessed currently focused somewhere else:
*/ 

function setInputAutoFocus(input) {
  const inputField = document.getElementById('color-input');
  const saturationInput = document.getElementById('saturation-input');
  const lightnessInput = document.getElementById('lightness-input');

  // Variable to track if focus should be given to colorInput based on valid key press
  let autoFocusEnabled = true;

  // Adding event listeners for focus/blur on other inputs
  saturationInput.addEventListener('focus', () => {
      autoFocusEnabled = false; // Disable auto-focus when saturation input is focused
  });

  saturationInput.addEventListener('blur', () => {
      autoFocusEnabled = true; // Enable auto-focus when leaving saturation input
  });

  lightnessInput.addEventListener('focus', () => {
      autoFocusEnabled = false; // Disable auto-focus when lightness input is focused
  });

  lightnessInput.addEventListener('blur', () => {
      autoFocusEnabled = true; // Enable auto-focus when leaving lightness input
  });

  // Add an event listener for keydown events
  document.addEventListener('keydown', function(event) {
      // Define the allowed keys for hex input
      const allowedKeys = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '#'];

      // Check if the active element is the main input field
      const isFocusingOtherInput = (document.activeElement !== inputField);

      // Trigger focus on inputField if allowed keys are pressed and autoFocus is enabled
      if (autoFocusEnabled && allowedKeys.includes(event.key.toUpperCase()) && isFocusingOtherInput) {
          inputField.focus();      // Focus on the main input
          inputField.value = '';   // Clear the input field
      }
  });

  // Listen for input changes and validate hex color
  inputField.addEventListener('input', function() {
      const hexValue = this.value.trim();

      // Validate the input value
      if (!isValidHex(hexValue)) {
          this.style.borderColor = 'red'; // Indicate invalid input
      } else {
          this.style.borderColor = ''; // Reset border if valid
      }
  });

}
setInputAutoFocus('colorInput');

function validateInputHex() {
  const hexValue = colorInput.value.trim();
  const label = document.getElementById('main-input-label');
  
  // Validate the input value
  if (!isValidHex(hexValue)) {         
      label.innerHTML = `<span>Type primary color hex: </span></span><span class="text-error" >Fail to read hex</span>`;
  } else {
      label.innerHTML = `<span>Type primary color hex:</span>`;
  }
}

/* ACCESSIBILITY SETTINGS AND KEYBOARD SUPPORT */

/* Segmented control accessibility */ 
document.querySelectorAll('.seg-ctrl label').forEach(label => {
  label.addEventListener('click', function () {
      const inputId = this.getAttribute('for');
      const radioInput = document.getElementById(inputId);
      radioInput.checked = true;
      changeColorScheme(radioInput.value); // Call your function to handle color changes here
  });

  // Allow the labels to be focused via keyboard
  label.addEventListener('keydown', function (event) {
      // Check for Enter key
      if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); // Prevent default behavior (like scrolling)
          this.click(); // Simulate click to check the radio button

          // Get the 'for' attribute to find the associated radio input
          const inputId = this.getAttribute('for');
          const radioInput = document.getElementById(inputId);
          changeColorScheme(radioInput.value); // Trigger the color change
      }
  });
});

// Function to change the secondary color based on the selected scheme
function changeColorScheme(scheme) {
  generateSecondaryColor(scheme);
  updateSecondary();
 
}
/* Toggle accessibility */
function setupToggleSwitch(checkboxId, callbackFunction) {
  const checkbox = document.getElementById(checkboxId);
  const slider = checkbox.nextElementSibling; // Get the slider after checkbox

  // Make the slider focusable
  slider.setAttribute('tabindex', '0');

  // Function to toggle checkbox state and execute callback
  function toggleCheckbox() {
      checkbox.checked = !checkbox.checked; // Toggle checkbox state
      updateSliderVisualState(); 
      if (callbackFunction) {
          callbackFunction(); 
      }
  }

  // Update the visual state of the slider based on checkbox
  function updateSliderVisualState() {
      if (checkbox.checked) {
          slider.classList.add('active'); // Add active class for visuals
      } else {
          slider.classList.remove('active'); // Remove active class
      }
  }

  // Initialize the visual state on setup
  updateSliderVisualState();

  // Add event listener for slider click (mouse event)
  slider.addEventListener('click', function() {
      toggleCheckbox(); // Call the toggle function
  });

  // Allow keyboard navigation with Enter or Space keys
  slider.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); // Prevent default behavior
          toggleCheckbox(); // Call the toggle function
      }
  });
  slider.addEventListener('click', function() {
    
    toggleCheckbox(); // Call the toggle function
});

  // Trigger the visual update if the checkbox state changes
  checkbox.addEventListener('change', updateSliderVisualState);
}

// Initialize both switches on load
document.addEventListener('DOMContentLoaded', function() {
  setupToggleSwitch('theme-checkbox', themeSwitch); // For the first toggle
  setupToggleSwitch('switch-chroma-checkbox', update_Neutral_Saturation); // For the second toggle
});

/*extract secondary hex <---------------------------*/ 
function getSecondaryComputedHex(element, cssVarName) {
  // Apply the CSS variable as a background color to the hidden element
  const sampleElement = document.getElementById('color-sample');
  sampleElement.style.backgroundColor = `var(${cssVarName})`;
  // Get the computed background color
  const computedColor = getComputedStyle(sampleElement).backgroundColor;
  // Convert the computed RGB color to hex
  const hex = extractRGBandConvertToHex(computedColor);

  return hex;
}
// Usage
function getSecondaryHex(){
const hexColor = getSecondaryComputedHex(document.documentElement, '--color-secondary');
return hexColor;
}
/* Accessibility status check:*/

function luminance(rgb) {
  if (!Array.isArray(rgb) || rgb.length !== 3) {
      throw new Error("Invalid input to luminance function. Expected an array of three numbers.");
  }
  const [r, g, b] = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = luminance(rgb1);
  const lum2 = luminance(rgb2);
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  return ratio;
}

function getContrastLevel(hex1, hex2) {
  const ratio = contrastRatio(hex1, hex2);
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large Text";
  return "Fail";
}

function presentWCAG_status(level){
const stautsLine = document.getElementById('contrast-status');
var status=" ";
if (level == "AAA"){
status = '<p class="valid">'+ icon_check +'<span class= "body-text-small-strong">AA Large</span></p>'+'<p class="valid">'+ icon_check + '<span class="body-text-small-strong"> AA </span> </p><p class="valid">'+ icon_check + '<span class="body-text-small-strong"> AAA </span></p>' ;
}else if (level == "AA"){
  status = '<p class="valid">'+ icon_check +'<span class= "body-text-small-strong">AA Large</span></p>'+'<p class="valid">'+ icon_check +'<span class="body-text-small-strong"> AA </span></p><p class="invalid">'+ icon_block + '<span class="body-text-small-strong"> AAA</span></p>' ;
}else if (level == "AA Large Text"){
  status = '<p class="valid">'+ icon_check +'<span class= "body-text-small-strong"> AA Large </span></p>'+'<p class="invalid">'+ icon_block +'<span class="body-text-small-strong"> AA </span><p class="invalid">'+ icon_block + '<span class="body-text-small-strong"> AAA </span></p>' ;
}else{
  status = '<p class="invalid">'+ icon_block +'<span class="body-text-small-strong">AA Large </span></p>'+'<p class="invalid">'+icon_block+ '<span class= "body-text-small-strong"> AA </span><p class="invalid">'+ icon_block + '<span class="body-text-small-strong"> AAA</span></p>' ;
}
stautsLine.innerHTML = status;
}


/* Reusable SVG icons as variables*/
const icon_copy = '<span class="icon-copy" ><svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/></svg></span>';
const icon_check = '<span class="icon-status"><svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960" fill="currentColor"><path d="M389-235 163-460l84-85 142 142 324-323 84 84-408 407Z"/></svg></span>'
const icon_block = '<span class="icon-status"><svg  xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960" fill="currentColor"><path d="M480-87.87q-80.67 0-152.11-30.72Q256.46-149.3 202.76-203q-53.69-53.7-84.29-125.25-30.6-71.55-30.6-152.23 0-81.67 30.6-152.49 30.6-70.81 84.29-124.39 53.7-53.57 125.13-84.17 71.44-30.6 152.11-30.6 81.67 0 152.61 30.6 70.93 30.6 124.63 84.17 53.69 53.58 84.29 124.39 30.6 70.82 30.6 152.49 0 80.68-30.6 152.23-30.6 71.55-84.29 125.25-53.7 53.7-124.63 84.41Q561.67-87.87 480-87.87Zm0-83q53.09 0 100.65-16.8 47.57-16.81 86.13-47.61L234.8-667.02q-30.32 39.04-47.13 86.37-16.8 47.32-16.8 100.17 0 128.81 90.28 219.21T480-170.87Zm245.43-123.06q30.09-39.05 46.9-86.37 16.8-47.33 16.8-100.18 0-128.56-90.28-218.61-90.28-90.04-218.85-90.04-52.85 0-100.05 16.56-47.21 16.57-86.25 46.66l431.73 431.98Z"/></svg></span>'