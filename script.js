/*global vars*/
const root = document.documentElement;
const colorInput = document.getElementById("colorInput");
const colorPicker = document.getElementById("colorPicker__primary");
var currentPrimaryColor = getComputedStyle(root).getPropertyValue('--color_primary-hex');


/*-----Setting color ticker objects: Showing hexes, click to copy, etc-------*/
/*show color values on a series of DOM elements*/
function presentColorValues(className){
  var sampElements = document.getElementsByClassName(className);
  for (var i = 0; i < sampElements.length; i++){
    setHex(sampElements[i]);
    setClickToCopy(sampElements[i]);
  }
}
/*initiate copy Hex on click*/
function setClickToCopy(domElement){
  domElement.addEventListener("click", function() {
  copyTextToClipboard(domElement.hex);
  domElement.innerHTML = "Copied to clipboard";

  // Display the indication for 2 seconds
  setTimeout(function() {
    // Revert back to displaying the hex value after 2 seconds
    domElement.innerHTML = domElement.hex+ icon_copy;
  }, 1250);
});
}
/*set Hex for single DOM element*/
function setHex(domElement){
    var style = window.getComputedStyle(domElement);
    var bgColorRGB = style.getPropertyValue('background-color');
    const colorString = bgColorRGB;
    const hexColor = extractRGBandConvertToHex(colorString);
    console.log(hexColor);
    domElement.hex = hexColor;
    domElement.innerHTML = domElement.hex+ icon_copy;
  
}
/* Extract RGB Values and convert them to hex*/
function extractRGBandConvertToHex(colorString) {
  // Extract numerical values from the string
  const rgbValues = colorString.match(/[+-]?\d+(?:\.\d+)?/g);

  // Convert the numerical values to the range 0-255 for R, G, and B
  const r = Math.round(parseFloat(rgbValues[0]) * 255);
  const g = Math.round(parseFloat(rgbValues[1]) * 255);
  const b = Math.round(parseFloat(rgbValues[2]) * 255);

  // Convert RGB values to a hexadecimal color representation
  const hexColor = "#" + ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');
  
  return hexColor;
}
/* RGB->HEX conversion | 
from Css-Tricks: https://css-tricks.com/converting-color-spaces-in-javascript/  */
function RGBToHex(r,g,b) {
  r = r.toString(16);
  g = g.toString(16);
  b = b.toString(16);

  if (r.length == 1)
    r = "0" + r;
  if (g.length == 1)
    g = "0" + g;
  if (b.length == 1)
    b = "0" + b;

  return "#" + r + g + b;
}
/*Copy hex to clipboard*/
function copyTextToClipboard(text) {
  const dummyElement = document.createElement("textarea");
  document.body.appendChild(dummyElement);
  dummyElement.value = text;
  dummyElement.select();
  document.execCommand("copy");
  document.body.removeChild(dummyElement);
}

/*-------------------------------------------------------*/


//INITIATING
function init(){
  presentColorValues('colorTicker');
  setInput();
  setColorPicker();
  setSliders();
  alignInputsToHex();
}

/*Color manipulation inputs*/
function setInput(){
colorInput.addEventListener("input", function() {
  const hexColor = colorInput.value;

  // Update CSS variables to reflect the new primary color
  document.documentElement.style.setProperty('--color_primary-hex', hexColor);
  presentColorValues('colorTicker');
  alignInputsToHex();
});
   /*Set click to copy*/
  const mainInput_copyToCB = document.getElementById('mainInput_copyToCB');
  mainInput_copyToCB.addEventListener("click", function() {
  copyTextToClipboard(colorInput.value);
  });
  
  
/**/
  
}
function setSliders(){
/*Map sliders and inputs to vars*/
/*const hueSlider = document.getElementById("hueSlider");*/
const saturationSlider = document.getElementById("saturationSlider");
const lightnessSlider = document.getElementById("lightnessSlider");
/*const hueInput = document.getElementById('hueInput');*/
const saturationInput = document.getElementById('saturationInput');
const lightnessInput = document.getElementById('lightnessInput');

//sync each slider and numerical input with one another:
/*syncInputs(hueSlider, hueInput);*/
syncInputs(saturationSlider, saturationInput);
syncInputs(lightnessSlider, lightnessInput);
/*Sync sliders range and number inputs*/
  
// Add event listeners to detect changes in sliders and numerical inputs 
  
saturationSlider.addEventListener("input", updateSecondary);
saturationInput.addEventListener("input", updateSecondary);
lightnessSlider.addEventListener("input", updateSecondary);
lightnessInput.addEventListener("input", updateSecondary);
/*hueSlider.addEventListener("input", updateSecondary);
hueInput.addEventListener("input", updateSecondary);*/

}
function syncInputs(rangeInput, numberInput) {
    rangeInput.addEventListener('input', function() {
        numberInput.value = rangeInput.value;
    });
    numberInput.addEventListener('input', function() {
        const parsedValue = parseInt(numberInput.value);
        if (parsedValue >= parseInt(numberInput.min) && parsedValue <= parseInt(numberInput.max)) {
            rangeInput.value = parsedValue;
        }
    });
}


const updateSecondary = () => {
  /*const h = hueSlider.value;*/
  const s = saturationSlider.value;
  const l = lightnessSlider.value;
  
  // Calculate secondary color based on primary color and slider values
  /*document.documentElement.style.setProperty('--ratio__sec_h', h);*/
  document.documentElement.style.setProperty('--ratio__sec_s', s);
  document.documentElement.style.setProperty('--ratio__sec_l', l);

  presentColorValues('colorTicker');
  alignInputsToHex();
  
};

function updateSecondary_Sliders(s, l){
 /* hueSlider.value = h;*/
  saturationSlider.value = s;
  lightnessSlider.value = l;
}


function setColorPicker(){
// Update color input value when color picker changes
  colorPicker.addEventListener("input", function () {
  colorInput.value = colorPicker.value;
  const hexColor = colorInput.value;
  // Update CSS variables to reflect the new primary color
  document.documentElement.style.setProperty('--color_primary-hex', hexColor);
  presentColorValues('colorTicker');
  checkInputContrast();
    alignInputsToHex()
    
});
}

function alignInputsToHex(){
   console.log("alignInputstO hEX CALLED!")
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
    return Y *0.009;
}

function getContrastColor(hex) {
   hex = hex.replace('#', '');
   var brightness = calculateBrightness(hex);
   return brightness > 0.6 ? '#000000' : '#ffffff';
   
}

// Example Usage
function checkInputContrast(){
var hexColor = colorInput.value;
var textColor = getContrastColor(hexColor);
colorInput.style.color = textColor;  // Outputs #ffffff for lighter colors, #000000 for darker colors
  
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
    console.log(selectedColorScheme)
  });
});

function generateSecondaryColor(colorScheme) {
  if(selectedColorScheme == "complementary"){
    document.documentElement.style.setProperty('--hue-differentiator', 180);
  }else if(selectedColorScheme == "triad"){
    document.documentElement.style.setProperty('--hue-differentiator', 120);
  }else if(selectedColorScheme == "quad"){
    document.documentElement.style.setProperty('--hue-differentiator', 90);
  }else if(selectedColorScheme == "analogous"){
    document.documentElement.style.setProperty('--hue-differentiator', 45);
  }
}


/* assets---------------------------------------------------------------------*/
const icon_copy = '<span class="icon_copy"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z"/></svg></span>';