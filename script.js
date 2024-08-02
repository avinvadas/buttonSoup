/*global vars*/
const root = document.documentElement;
const colorInput_wrapper = document.getElementsByClassName('wrapper__primary_color')[0];
const colorInput = document.getElementById("colorInput");
const colorInput_copyToCB = document.getElementById("mainInput_copyToCB");
const colorPicker = document.getElementById("colorPicker__primary");
const saturationSlider = document.getElementById("saturationSlider");
const saturationInput = document.getElementById("saturationInput");
const lightnessSlider = document.getElementById("lightnessSlider");
const lightnessInput = document.getElementById("lightnessInput");
var currentPrimaryColor = getComputedStyle(root).getPropertyValue('--color_primary-hex');
const neutral_saturation_level = getComputedStyle(root).getPropertyValue('--saturation-factor');


/*-----Setting color ticker objects: Showing hexes, click to copy, etc-------*/
/*show color values on a series of DOM elements*/
function presentColorValues(className) {
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
    domElement.innerHTML = '<span class="ticker__hex">✓ Copied</span>' + icon_copy;
    domElement.style.color = getContrastColor(domElement.hex);

    // Display the indication for 2 seconds
    setTimeout(function () {
      // Revert back to displaying the hex value after 2 seconds
      domElement.innerHTML = '<span class="ticker__hex">' + domElement.hex + '</span>' + icon_copy;
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
  domElement.innerHTML = `<span class="ticker__hex" style="color: ${textColor};">${domElement.hex}</span><span class="icon_copy" style="color: ${textColor};">${icon_copy}</span>`;
}

/* Extract RGB Values and convert them to hex*/
function extractRGBandConvertToHex(colorString) {
  let r = 0, g = 0, b = 0; // Initialize RGB values
  let isValidRGB = false; // To check if the RGB values are valid

  // Check for color(srgb ...) format
  const srgbMatch = colorString.match(/color\(srgb\s+([0-1]\.\d+|[01])\s+([0-1]\.\d+|[01])\s+([0-1]\.\d+|[01])\)/);
  if (srgbMatch) {
    r = Math.round(parseFloat(srgbMatch[1]) * 255);
    g = Math.round(parseFloat(srgbMatch[2]) * 255);
    b = Math.round(parseFloat(srgbMatch[3]) * 255);
    isValidRGB = true;
  } else {
    // Use regex to extract RGB or RGBA values if not srgb
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

  // If RGB values are not valid, log the warning and use a default color
  if (!isValidRGB) {
    console.warn('Invalid RGB/RGBA value provided: returning #000000');
    return '#000000'; // Default to black
  }

  // Convert to hex
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;

  return hex;
}


/*Copy to clipboard: Single hex: */
function copyTextToClipboard(text) {
  // Use the Clipboard API for better usability, especially on mobile
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard:', text);
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
/*Copy to Clipboard: entire palette: */
function copyPaletteToClipboard(palette) {
  // Construct the selector directly without changing 'palette---primary'
  const paletteSelector = `.palette--${palette}`;
  const paletteElement = document.querySelector(paletteSelector);

  console.log('Palette Selector:', paletteSelector);
  console.log('Palette Element:', paletteElement);

  if (!paletteElement) {
    console.error('Palette not found:', palette);
    return; // Exit early if the palette is not found
  }

  const colorTickers = paletteElement.getElementsByClassName("colorTicker");
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

/*-------------------------------------------------------*/

//INITIATING
function init() {
  document.documentElement.style.setProperty('--color_primary-hex', getRandomHexColor())
  
  presentColorValues('colorTicker');
  setInput();
  setColorPicker();
  setSliders();
  alignInputsToHex();
  checkInputContrast();
  setInputAutoFocus("colorInput");
}

/*Color manipulation inputs*/
function setInput() {
  colorInput.addEventListener("input", function () {
    colorPicker.value = colorInput.value;
    const hexColor = colorInput.value;
    document.documentElement.style.setProperty('--color_primary-hex', hexColor);
    document.documentElement.style.setProperty('--input__sec_s', hexToHSL(hexColor, 's'));
    document.documentElement.style.setProperty('--input__sec_l', hexToHSL(hexColor, 'l'));
    presentColorValues('colorTicker');
    checkInputContrast();
    alignInputsToHex();
    updateSecondary_Sliders();
  });
  /*Set click to copy*/
  const mainInput_copyToCB = document.getElementById('mainInput_copyToCB');
  mainInput_copyToCB.addEventListener("click", function () {
    copyTextToClipboard(colorInput.value);
    copyFeedback_mainInput()
  });
  function copyFeedback_mainInput() {
    // Show feedback message
    const originalContent = colorInput.value; // Store the existing content
    colorInput.value = '✓ Copied';

    // Set a timeout to revert back to original content
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
    document.documentElement.style.setProperty('--color_primary-hex', hexColor);
    document.documentElement.style.setProperty('--input__sec_s', hexToHSL(hexColor, 's'));
    document.documentElement.style.setProperty('--input__sec_l', hexToHSL(hexColor, 'l'));
    presentColorValues('colorTicker');
    checkInputContrast();
    alignInputsToHex();
    updateSecondary();
    updateSecondary_Sliders();
  });
}

function setSliders() {
  /*Map sliders and inputs to vars*/
  /*const hueSlider = document.getElementById("hueSlider");*/
  const saturationSlider = document.getElementById("saturationSlider");
  const saturationInput = document.getElementById("saturationInput");
  const lightnessSlider = document.getElementById("lightnessSlider");
  const lightnessInput = document.getElementById("lightnessInput");
  //sync each slider and numerical input with one another:
  syncInputs(saturationSlider, saturationInput);
  syncInputs(lightnessSlider, lightnessInput);
  /*Sync sliders range and number inputs*/
  saturationSlider.addEventListener("input", updateSecondary);
  saturationInput.addEventListener("input", updateSecondary);
  lightnessSlider.addEventListener("input", updateSecondary);
  lightnessInput.addEventListener("input", updateSecondary);

  saturationSlider.value = getComputedStyle(root).getPropertyValue('--ratio__sec_s');
  saturationInput.value = saturationSlider.value;
  lightnessSlider.value = getComputedStyle(root).getPropertyValue('--ratio__sec_l');
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

const updateSecondary = () => {
  const s = saturationSlider.value;
  const l = lightnessSlider.value;

  // Calculate secondary color based on primary color and slider values
  /*document.documentElement.style.setProperty('--ratio__sec_h', h);*/
  document.documentElement.style.setProperty('--ratio__sec_s', s);
  document.documentElement.style.setProperty('--ratio__sec_l', l);

  presentColorValues('colorTicker');
  alignInputsToHex();
};

function updateSecondary_Sliders() {
  saturationSlider.value = getComputedStyle(root).getPropertyValue('--input__sec_s');
  saturationInput.value = getComputedStyle(root).getPropertyValue('--input__sec_s');
  lightnessSlider.value = getComputedStyle(root).getPropertyValue('--input__sec_l');
  lightnessInput.value = getComputedStyle(root).getPropertyValue('--input__sec_l');
}

function alignInputsToHex() {
  const currentPrimaryColor = getComputedStyle(root).getPropertyValue('--color_primary-hex').trim();
  colorInput.value = currentPrimaryColor;
  colorPicker.value = currentPrimaryColor;
}

/*Check input contrast for text*/
function hexToRgb(hex) {
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

function calculateBrightness(hex) {
  const { r, g, b } = hexToRgb(hex);
  // Calculate relative luminance
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Y * 0.009;
}

function getContrastColor(hex) {
  hex = hex.replace('#', '');
  var brightness = calculateBrightness(hex);
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
  if (selectedColorScheme == "complementary") {
    document.documentElement.style.setProperty('--hue-differentiator', 180);
  } else if (selectedColorScheme == "triad") {
    document.documentElement.style.setProperty('--hue-differentiator', 120);
  } else if (selectedColorScheme == "quad") {
    document.documentElement.style.setProperty('--hue-differentiator', 90);
  } else if (selectedColorScheme == "analogous") {
    document.documentElement.style.setProperty('--hue-differentiator', 45);
  }
}

function update_Neutral_Saturation() {
  const chromaToggle = document.getElementById("switchChroma").querySelector('input[type="checkbox"]');
  const chromaToggle__label = document.getElementById("chromaToggle__label");
  const root = document.documentElement; // Define root if not done earlier

  if (chromaToggle.checked) {
    root.style.setProperty('--saturation-factor', neutral_saturation_level);
    chromaToggle__label.innerHTML = "Chroma on";
  } else {
    root.style.setProperty('--saturation-factor', 0);
    chromaToggle__label.innerHTML = "Chroma off";
  }
  presentColorValues('colorTicker');
  alignInputsToHex();
}

function themeSwitch() {
  var element = document.body;
  element.classList.toggle("mainTheme--dark");
}

function getRandomHexColor() {
  // Generate a random hex color
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`; // Ensure that the hex is always 6 characters
}

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

function setInputAutoFocus(input){
  // Select the input field you want to focus
  const inputField = document.getElementById(input);

  // Variable to track if focus has been set
  let focusSet = false;

  // Add an event listener to the document for keydown events
  document.addEventListener('keydown', function() {
      if (!focusSet) {
          inputField.focus();
          focusSet = true; // Set the flag to prevent repeated calls
      }
  });

  // Add an event listener for focus on the input field to clear the value
  inputField.addEventListener('focus', function() {
      inputField.value = ''; // Clear the input field
  });

  // Reset the focusSet flag when the input field loses focus
  inputField.addEventListener('blur', function() {
      focusSet = false; // Resetting focusSet allows refocusing
  });
}
/* assets---------------------------------------------------------------------*/
const icon_copy = '<span class="icon_copy"><svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"></path></svg></span>';