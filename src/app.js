/* This is the main Javascript file, called into the DOM.
It builds the UI, and coordinates the functionalities with the color calculations.
*/

import ColorManager from './js/colorManager.js';
import * as colorUtils from './js/colorUtils.js';
import { ScalesRow, HarmonicColorRow, TertiaryRow } from './js/colorPalette.js';
import { uiManager } from './js/uiManager.js';
import { copyTimeouts } from './js/uiManager.js';

// Basic parameters
let primaryColor;
let secondaryColor;
let tertiaryColor;

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

// Observer for tertiaryColor updates
const tertiaryColorObserver = {
    update({ tertiaryColor: updatedTertiaryColor }) {
        if (updatedTertiaryColor) {
            tertiaryColor = updatedTertiaryColor; // Update the global variable
            console.log('Updated global tertiaryColor:', tertiaryColor);
        }
    }
};

// Register the observer with ColorManager
colorManager.addObserver(tertiaryColorObserver);


const iconSvgCompLong = '<svg  class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g><path d="M17.202,37.029C9.346,35.701 3.362,28.865 3.362,20.631C3.362,13.163 8.331,6.655 15.44,4.635C15.911,2.555 17.772,1 19.993,1C22.569,1 24.661,3.092 24.661,5.668C24.661,7.99 22.961,9.919 20.738,10.276L20.738,33.09C22.037,33.416 23,34.592 23,35.992C23,37.643 21.66,38.983 20.008,38.983C18.722,38.983 17.624,38.169 17.202,37.029ZM15.578,7.186C9.82,9.073 5.842,14.468 5.842,20.631C5.842,27.557 10.819,33.321 17.391,34.543C17.782,33.838 18.45,33.307 19.248,33.098L19.248,10.276C17.534,10.001 16.13,8.791 15.578,7.186ZM19.993,2.617C18.309,2.617 16.942,3.984 16.942,5.668C16.942,7.352 18.309,8.719 19.993,8.719C21.677,8.719 23.044,7.352 23.044,5.668C23.044,3.984 21.677,2.617 19.993,2.617Z"/><g><path d="M19.993,37.262L19.993,34.782C27.808,34.782 34.144,28.446 34.144,20.631C34.144,14.031 29.582,8.308 23.149,6.836L23.702,4.419C31.263,6.149 36.624,12.875 36.624,20.631C36.624,29.816 29.178,37.262 19.993,37.262Z" style="fill-opacity:0.33;"/></g></g></svg>';


const iconSvgCompShort = '<svg  class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g><path d="M22.784,37.029C30.64,35.701 36.624,28.865 36.624,20.631C36.624,13.163 31.655,6.655 24.546,4.635C24.076,2.555 22.215,1 19.993,1C17.417,1 15.325,3.092 15.325,5.668C15.325,7.99 17.025,9.919 19.248,10.276L19.248,33.09C17.949,33.416 16.986,34.592 16.986,35.992C16.986,37.643 18.327,38.983 19.978,38.983C21.264,38.983 22.362,38.169 22.784,37.029ZM24.408,7.186C30.166,9.073 34.144,14.468 34.144,20.631C34.144,27.557 29.168,33.321 22.595,34.543C22.204,33.838 21.536,33.307 20.738,33.098L20.738,10.276C22.453,10.001 23.856,8.791 24.408,7.186ZM19.993,2.617C21.677,2.617 23.044,3.984 23.044,5.668C23.044,7.352 21.677,8.719 19.993,8.719C18.309,8.719 16.942,7.352 16.942,5.668C16.942,3.984 18.309,2.617 19.993,2.617Z"/><g><path d="M19.993,37.262L19.993,34.782C12.178,34.782 5.842,28.446 5.842,20.631C5.842,14.031 10.404,8.308 16.837,6.836L16.284,4.419C8.723,6.149 3.362,12.875 3.362,20.631C3.362,29.816 10.808,37.262 19.993,37.262Z" style="fill-opacity:0.33;"/></g></g></svg>'

const iconSvgTriadLong = `<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <path d="M29.436,35.214C26.753,37.07 23.499,38.157 19.993,38.157C10.814,38.157 3.362,30.704 3.362,21.526C3.362,13.92 8.478,7.501 15.453,5.523C15.893,3.415 17.763,1.83 20.001,1.83C22.563,1.83 24.645,3.911 24.645,6.474C24.645,8.695 23.083,10.553 21,11.011L21,18.413C22.235,18.83 23.125,19.999 23.125,21.374C23.125,21.904 22.993,22.404 22.76,22.842L29.714,29.796C30.138,29.581 30.618,29.46 31.125,29.46C32.85,29.46 34.25,30.86 34.25,32.585C34.25,34.31 32.85,35.71 31.125,35.71C30.503,35.71 29.923,35.528 29.436,35.214ZM15.623,8.029C9.93,9.873 5.808,15.222 5.808,21.526C5.808,29.354 12.164,35.71 19.993,35.71C22.989,35.71 25.768,34.779 28.059,33.192C28.02,32.996 28,32.793 28,32.585C28,32.022 28.149,31.494 28.409,31.038L21.492,24.12C21.048,24.362 20.54,24.499 20,24.499C18.276,24.499 16.875,23.099 16.875,21.374C16.875,19.926 17.862,18.707 19.199,18.353L19.199,11.05C17.536,10.76 16.176,9.585 15.623,8.029ZM20.001,3.349C18.275,3.349 16.876,4.749 16.876,6.474C16.876,8.199 18.275,9.598 20.001,9.598C21.725,9.598 23.125,8.199 23.125,6.474C23.125,4.749 21.725,3.349 20.001,3.349Z"/>
    <path d="M32.418,32.577L30.582,30.959C32.818,28.451 34.177,25.146 34.177,21.526C34.177,14.949 29.692,9.412 23.616,7.809L24.235,5.441C31.362,7.319 36.624,13.813 36.624,21.526C36.624,25.766 35.034,29.638 32.418,32.577Z" style="fill-opacity:0.33;"/>
</svg>`;

const iconSvgTriadShort = `<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <path d="M32.418,32.576C29.371,35.999 24.932,38.157 19.993,38.157C10.814,38.157 3.362,30.704 3.362,21.526C3.362,13.709 8.766,7.145 16.039,5.368L16.618,7.746C10.416,9.262 5.808,14.859 5.808,21.526C5.808,29.354 12.164,35.71 19.993,35.71C24.201,35.71 27.984,33.873 30.582,30.959L32.418,32.576Z" style="fill-opacity:0.33;"/>
    <path d="M33.743,30.879C34.064,31.37 34.25,31.956 34.25,32.585C34.25,34.309 32.85,35.71 31.125,35.71C29.4,35.71 28,34.309 28,32.585C28,32.022 28.149,31.494 28.409,31.038L21.491,24.12C21.048,24.362 20.54,24.499 20,24.499C18.276,24.499 16.875,23.099 16.875,21.374C16.875,19.926 17.862,18.707 19.199,18.353L19.199,11.05C17.017,10.67 15.356,8.764 15.356,6.474C15.356,3.911 17.437,1.83 20.001,1.83C22.239,1.83 24.11,3.417 24.548,5.526C31.515,7.51 36.624,13.925 36.624,21.526C36.624,24.993 35.561,28.213 33.743,30.879ZM24.376,8.033C23.844,9.525 22.57,10.666 21,11.011L21,18.412C22.235,18.83 23.125,19.999 23.125,21.374C23.125,21.904 22.993,22.404 22.759,22.841L29.714,29.796C30.138,29.581 30.617,29.46 31.125,29.46C31.325,29.46 31.522,29.479 31.712,29.515C33.267,27.239 34.177,24.488 34.177,21.526C34.177,15.226 30.062,9.881 24.376,8.033ZM20.001,3.349C18.275,3.349 16.876,4.749 16.876,6.474C16.876,8.199 18.275,9.598 20.001,9.598C21.725,9.598 23.125,8.199 23.125,6.474C23.125,4.749 21.725,3.349 20.001,3.349Z"/>
    </svg>`;
    
const iconSvgQuadLong = '<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M34.879,21.833C33.601,29.746 26.732,35.798 18.46,35.798C9.282,35.798 1.829,28.346 1.829,19.167C1.829,9.988 9.282,2.536 18.46,2.536C26.732,2.536 33.601,8.587 34.879,16.501C34.456,16.275 33.973,16.147 33.461,16.147C33.074,16.147 32.705,16.22 32.365,16.353C31.058,9.87 25.326,4.982 18.46,4.982C10.632,4.982 4.276,11.338 4.276,19.167C4.276,26.995 10.632,33.351 18.46,33.351C25.326,33.351 31.058,28.463 32.365,21.981C32.705,22.113 33.074,22.186 33.461,22.186C33.973,22.186 34.456,22.058 34.879,21.833Z" style="fill-opacity:0.33;"/><path d="M15.656,35.562C14.679,35.396 13.732,35.145 12.821,34.816C10.887,33.885 8.724,32.626 6.765,30.986C3.718,27.971 1.829,23.788 1.829,19.167C1.829,9.988 9.282,2.536 18.46,2.536C26.047,2.536 32.453,7.626 34.449,14.574C36.567,15.027 38.157,16.912 38.157,19.164C38.157,21.755 36.054,23.858 33.463,23.858C31.126,23.858 29.186,22.147 28.828,19.911L21.355,19.911C21.085,20.97 20.251,21.805 19.193,22.077L19.193,31.537C20.489,31.87 21.448,33.047 21.448,34.447C21.448,36.104 20.102,37.45 18.445,37.45C17.181,37.45 16.099,36.668 15.656,35.562ZM31.934,14.725C30.068,9.069 24.738,4.982 18.46,4.982C10.632,4.982 4.276,11.338 4.276,19.167C4.276,26.073 9.223,31.833 15.763,33.094C16.149,32.331 16.851,31.754 17.697,31.537L17.697,22.077C16.401,21.744 15.441,20.567 15.441,19.167C15.441,17.51 16.787,16.164 18.445,16.164C19.843,16.164 21.019,17.121 21.353,18.415L28.829,18.415C29.106,16.692 30.322,15.281 31.934,14.725ZM32.364,16.345C31.237,16.785 30.437,17.882 30.437,19.164C30.437,20.834 31.793,22.19 33.463,22.19C35.133,22.19 36.489,20.834 36.489,19.164C36.489,17.594 35.29,16.301 33.759,16.153C33.752,16.155 33.745,16.157 33.738,16.16C33.647,16.151 33.555,16.147 33.461,16.147C33.074,16.147 32.705,16.22 32.365,16.353C32.365,16.35 32.364,16.348 32.364,16.345Z"/></svg>';

const iconSvgQuadShort = '<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M34.879,21.833C33.601,29.746 26.732,35.798 18.46,35.798C9.282,35.798 1.829,28.346 1.829,19.167C1.829,9.988 9.282,2.536 18.46,2.536C26.732,2.536 33.601,8.587 34.879,16.501C34.456,16.275 33.973,16.147 33.461,16.147C33.074,16.147 32.705,16.22 32.365,16.353C31.058,9.87 25.326,4.982 18.46,4.982C10.632,4.982 4.276,11.338 4.276,19.167C4.276,26.995 10.632,33.351 18.46,33.351C25.326,33.351 31.058,28.463 32.365,21.981C32.705,22.113 33.074,22.186 33.461,22.186C33.973,22.186 34.456,22.058 34.879,21.833Z" style="fill-opacity:0.33;"/><path d="M17.706,22.091C16.404,21.755 15.441,20.572 15.441,19.167C15.441,17.5 16.794,16.147 18.46,16.147C19.866,16.147 21.049,17.11 21.385,18.412L28.825,18.412C29.186,16.178 31.126,14.47 33.461,14.47C36.053,14.47 38.157,16.575 38.157,19.167C38.157,21.42 36.567,23.305 34.448,23.759C32.704,29.834 27.588,34.488 21.26,35.563C20.812,36.669 19.727,37.45 18.46,37.45C16.794,37.45 15.441,36.097 15.441,34.43C15.441,33.024 16.404,31.842 17.706,31.506L17.706,22.091ZM36.48,19.167C36.48,17.5 35.127,16.147 33.461,16.147C31.794,16.147 30.441,17.5 30.441,19.167C30.441,20.833 31.794,22.186 33.461,22.186C35.127,22.186 36.48,20.833 36.48,19.167ZM21.385,19.921C21.111,20.982 20.276,21.817 19.215,22.091L19.215,31.506C20.072,31.727 20.782,32.315 21.168,33.093C26.235,32.112 30.343,28.43 31.934,23.609C30.321,23.054 29.104,21.644 28.825,19.921L21.385,19.921Z"/></svg>';

const iconSvgAnaLong = '<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M34.557,15.689L32.14,16.336C31.17,12.717 28.802,9.631 25.557,7.757C18.804,3.859 10.156,6.176 6.257,12.929C2.359,19.682 4.676,28.33 11.429,32.229C16.967,35.426 23.962,34.505 28.483,29.983L30.253,31.753C24.93,37.076 16.696,38.16 10.178,34.396C2.228,29.806 -0.499,19.627 4.09,11.678C8.68,3.728 18.859,1.001 26.809,5.59C30.628,7.796 33.416,11.428 34.557,15.689Z"/><path d="M20.004,22.562C19.549,22.84 19.014,23 18.442,23C16.787,23 15.442,21.656 15.442,20C15.442,18.344 16.787,17 18.442,17C19.838,17 21.012,17.955 21.347,19.247L28.829,19.247C29.186,17.009 31.127,15.296 33.465,15.296C36.055,15.296 38.158,17.399 38.158,19.99C38.158,22.58 36.055,24.684 33.465,24.684C31.13,24.684 29.192,22.976 28.831,20.743L21.349,20.743C21.282,21.007 21.179,21.258 21.047,21.489L27.74,28.182C28.061,28.064 28.409,28 28.771,28C30.427,28 31.771,29.344 31.771,31C31.771,32.656 30.427,34 28.771,34C27.115,34 25.771,32.656 25.771,31C25.771,30.256 26.042,29.574 26.492,29.05L20.004,22.562ZM33.465,16.925C31.773,16.925 30.4,18.298 30.4,19.99C30.4,21.681 31.773,23.054 33.465,23.054C35.156,23.054 36.529,21.681 36.529,19.99C36.529,18.298 35.156,16.925 33.465,16.925Z"/><path d="M30.278,31.727L28.505,29.962C30.255,28.204 31.511,26.017 32.148,23.62L34.567,24.263C33.817,27.084 32.338,29.659 30.278,31.727Z" style="fill-opacity:0.33;"/></svg>';

const iconSvgAnaShort = '<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M34.557,15.689L32.14,16.336C31.17,12.717 28.802,9.631 25.557,7.757C18.804,3.859 10.156,6.176 6.257,12.929C2.359,19.682 4.676,28.33 11.429,32.229C16.967,35.426 23.962,34.505 28.483,29.983L30.253,31.753C24.93,37.076 16.696,38.16 10.178,34.396C2.228,29.806 -0.499,19.627 4.09,11.678C8.68,3.728 18.859,1.001 26.809,5.59C30.628,7.796 33.416,11.428 34.557,15.689Z" style="fill-opacity:0.33;"/><path d="M20.004,22.562C19.549,22.84 19.014,23 18.442,23C16.787,23 15.442,21.656 15.442,20C15.442,18.344 16.787,17 18.442,17C19.838,17 21.012,17.955 21.347,19.247L28.829,19.247C29.186,17.009 31.127,15.296 33.465,15.296C36.055,15.296 38.158,17.399 38.158,19.99C38.158,22.58 36.055,24.684 33.465,24.684C31.13,24.684 29.192,22.976 28.831,20.743L21.349,20.743C21.282,21.007 21.179,21.258 21.047,21.489L27.74,28.182C28.061,28.064 28.409,28 28.771,28C30.427,28 31.771,29.344 31.771,31C31.771,32.656 30.427,34 28.771,34C27.115,34 25.771,32.656 25.771,31C25.771,30.256 26.042,29.574 26.492,29.05L20.004,22.562ZM33.465,16.925C31.773,16.925 30.4,18.298 30.4,19.99C30.4,21.681 31.773,23.054 33.465,23.054C35.156,23.054 36.529,21.681 36.529,19.99C36.529,18.298 35.156,16.925 33.465,16.925Z"/<path d="M30.278,31.727L28.505,29.962C30.255,28.204 31.511,26.017 32.148,23.62L34.567,24.263C33.817,27.084 32.338,29.659 30.278,31.727Z"/></svg>';

const iconSvgFullCircle = '<svg class="utility-icon" width="100%" height="100%" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill:currentColor;fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M20,3.431C29.144,3.431 36.569,10.856 36.569,20C36.569,29.145 29.144,36.569 20,36.569C10.855,36.569 3.431,29.145 3.431,20C3.431,10.856 10.855,3.431 20,3.431ZM20,5.785C12.155,5.785 5.785,12.155 5.785,20C5.785,27.845 12.155,34.215 20,34.215C27.845,34.215 34.215,27.845 34.215,20C34.215,12.155 27.845,5.785 20,5.785ZM20,16.867C21.73,16.867 23.133,18.27 23.133,20C23.133,21.73 21.73,23.133 20,23.133C18.27,23.133 16.867,21.73 16.867,20C16.867,18.27 18.27,16.867 20,16.867Z"/></svg>';

let iconShortRange = iconSvgCompShort;
let iconLongRange = iconSvgCompLong;
let iconFullRange = iconSvgFullCircle;
document.addEventListener('DOMContentLoaded', init);


   
/* Color management */
function setPrimary(color) {
    primaryColor = new colorUtils.Color(color);
    document.documentElement.style.setProperty('--color-primary', primaryColor.toString({format: "srgb"}));
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

const primaryColorInput = document.getElementById('color-input');
if (primaryColorInput) {
    primaryColorInput.addEventListener('input', handlePrimaryColorInput);
    primaryColorInput.addEventListener('paste', (event) => {
        // Prevent default paste behavior to control the input
        event.preventDefault();

        // Get the pasted text and remove any leading or trailing whitespace
        const pasteData = (event.clipboardData || window.clipboardData).getData('text').trim();

        // Remove any `#` from the pasted text, then prepend a single `#`
        let sanitizedValue = '#' + pasteData.replace(/#/g, '').slice(0, 6);

        // Update the input field and call the handler
        primaryColorInput.value = sanitizedValue;
        handlePrimaryColorInput({ target: primaryColorInput });
    });
}

function initiateColors() {
    const params = new URLSearchParams(window.location.search);

    let primaryLCH;
    let hueDifValue = hueDif; // Default to current hueDif (179.5)

    // Step 1: Load the primaryColor
    if (params.has('primaryColor')) {
        const primaryColorValue = params.get('primaryColor');
        const primaryColorInput = document.getElementById('color-input');
        if (primaryColorInput) {
            primaryColorInput.value = primaryColorValue;
            try {
                primaryLCH = new Color(primaryColorValue).to("lch");  // Convert hex to LCH
                setPrimary(primaryLCH);  // Set primary color
            } catch (error) {
                console.error('Error converting primary color to LCH:', error);
                return;
            }
        }
    } else {
        // Fallback: Generate a random primary color if no query parameter exists
        primaryLCH = colorUtils.generateRandomLCH();  // Generate random LCH color
        setPrimary(primaryLCH);
    }

    // Ensure the primary color is set before proceeding
    if (!primaryLCH) {
        console.error('Primary color (LCH) is not defined. Cannot calculate secondary color.');
        return;
    }

    // Step 2: Load the numeric hueDif and update seg-ctrl accordingly
    if (params.has('hueDif')) {
        const hueDifParam = params.get('hueDif');
        hueDifValue = parseFloat(hueDifParam);

        if (isNaN(hueDifValue)) {
            console.error(`Invalid hueDif value: ${hueDifParam}. Falling back to default hueDif.`);
            hueDifValue = 179.5;  // Default hueDif if NaN
        }

        // Update the seg-ctrl UI based on the hueDif
        let segCtrlValue;
        switch (hueDifValue) {
            case 179.5:
                segCtrlValue = 'complementary';
                break;
            case 120:
                segCtrlValue = 'triad';
                break;
            case 60:
                segCtrlValue = 'quad';
                break;
            case 30:
                segCtrlValue = 'analogous';
                break;
            default:
                console.error('Invalid numeric hueDif value:', hueDifValue);  // Log error
                return;  // Stop execution if hueDif is invalid
        }

        const segCtrlInput = document.querySelector(`.seg-ctrl input[value="${segCtrlValue}"]`);
        if (segCtrlInput) {
            segCtrlInput.checked = true;

            // Manually trigger handleHueChange to update the hueDif and recalculate secondary color
            handleHueChange({ target: segCtrlInput });
        } else {
            console.error('Failed to update seg-ctrl for hueDif:', hueDifValue);  // Log error
        }
    } else {
        // Fallback: Use default hue difference if no query parameter exists
        hueDifValue = 179.5;  // Default to complementary if no query parameter
        setSecondary(hueDifValue); // Ensure secondary color is calculated with the default hueDif
    }

    // Step 3: Set chroma and lightness sliders
    const chromaSlider = document.getElementById('chroma-slider');
    const lightnessSlider = document.getElementById('lightness-slider');
    if (chromaSlider && lightnessSlider) {
        if (params.has('chroma')) {
            const chromaValue = params.get('chroma');
            chromaSlider.value = chromaValue;
            lastUserChroma = parseFloat(chromaValue);
        } else {
            chromaSlider.value = lastUserChroma;
        }

        if (params.has('lightness')) {
            const lightnessValue = params.get('lightness');
            lightnessSlider.value = lightnessValue;
            lastUserLightness = parseFloat(lightnessValue);
        } else {
            lightnessSlider.value = lastUserLightness;
        }
    }

    // Step 4: Load the dynamically created chroma toggle state
    const chromaToggle = document.getElementById('chroma-toggle-checkbox');
    if (chromaToggle && params.has('chromaToggle')) {
        chromaToggle.checked = (params.get('chromaToggle') === 'on');
    }

    // After setting chroma and lightness, update the secondary color controls
    updateSecondaryColorControls();

    // Update the rest of the UI
    updateColorProperties();
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
    updateUIElements();
     
}

// New function to update UI elements without setting up rows again
function appendIconToRow(rowLabelText, svgIcon) {
    // Select all row labels within palettes-section
    const rowLabels = document.querySelectorAll('.palettes-section .palette-label');

    rowLabels.forEach(labelElement => {
        if (labelElement.textContent.trim() === rowLabelText) {
            // Remove any existing icon in the label
            const existingIcon = labelElement.querySelector('.palette-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
            
            // Create a new span for the icon and add it at the beginning of the label
            const iconSpan = document.createElement('span');
            iconSpan.className = 'palette-icon';
            iconSpan.innerHTML = svgIcon;
            labelElement.insertAdjacentElement('afterbegin', iconSpan);
        }
    });
}

function createAndAddRow(rowInstance, label, containerIdPrefix, isNeutral = false) {
    try {
        // Check if the row already exists by label
        const existingRow = rows.find(row => row.label === label);
        if (existingRow) {
            console.warn(`Row with label "${label}" already exists. Updating existing row.`);
            existingRow.row.update(rowInstance.sourceColor);
            return;
        }

        // Generate unique containerId
        const containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
        rowInstance.containerId = containerId; // Assign containerId to the row
        console.log(`Assigned containerId: ${containerId} to ${label}`);

        // Ensure the palettes section exists
        const palettesSection = document.querySelector('.palettes-section');
        if (!palettesSection) {
            console.error('Palettes section not found');
            return;
        }

        // Add the row instance to the rows array and observe it
        rows.push({ row: rowInstance, label });
        colorManager.addObserver(rowInstance);

        // Create row wrapper
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'row-wrapper';

        // Add label and buttons container
        const labelButtonContainer = document.createElement('div');
        labelButtonContainer.className = 'label-button-container';

        // Add label
        if (label) {
            const labelElement = document.createElement('h4');
            labelElement.textContent = label;
            labelElement.className = 'palette-label heading-04';
            labelButtonContainer.appendChild(labelElement);
        }

        // Add chroma toggle for neutral palettes
        if (isNeutral) {
            try {
                const chromaToggle = rowInstance.createChromaToggle();
                labelButtonContainer.appendChild(chromaToggle);
            } catch (error) {
                console.error(`Failed to create chroma toggle for ${label}:`, error);
            }
        }

        // Add "Copy as JSON" button
        const copyJsonButton = document.createElement('button');
        copyJsonButton.textContent = 'Copy as JSON';
        copyJsonButton.className = 'copy-json-button';
        copyJsonButton.addEventListener('click', () => {
            try {
                const jsonPalette = rowInstance.getSwatchesAsJson();
                uiManager.copyToClipboard(jsonPalette, copyJsonButton);
            } catch (error) {
                console.error(`Failed to copy JSON for ${label}:`, error);
            }
        });
        labelButtonContainer.appendChild(copyJsonButton);

        // Create the swatch container
        const swatchContainer = document.createElement('div');
        swatchContainer.id = containerId;
        swatchContainer.className = 'color-swatch-container';

        // Explicit assignment for TertiaryRow
        if (rowInstance instanceof TertiaryRow) {
            console.log('TertiaryRow detected. Ensuring proper containerId assignment:', containerId);
            rowInstance.containerId = containerId;
        }

        // Append labelButtonContainer and swatchContainer to rowWrapper
        rowWrapper.appendChild(labelButtonContainer);
        rowWrapper.appendChild(swatchContainer);

        // Append the row wrapper to the palettes section
        palettesSection.appendChild(rowWrapper);
        console.log(`Row wrapper appended to palettes section for ${label}. ContainerId: ${containerId}`);

        // Generate swatches for the row
        try {
            const foundSwatchContainer = document.getElementById(containerId);
            if (!foundSwatchContainer) {
                throw new Error(`Swatch container not found for containerId: ${containerId}`);
            }
            console.log(`Swatch container found:`, foundSwatchContainer);
            rowInstance.createSwatches(containerId, label);
        } catch (error) {
            console.error(`Failed to create swatches for ${label}:`, error);
        }

        // Verify container creation
        const createdContainer = document.getElementById(containerId);
        if (!createdContainer) {
            console.error(`Container for ${containerId} could not be created.`);
        } else {
            console.log(`Container successfully created for ${label}:`, createdContainer);
        }

        // Cleanup duplicate rows or containers if any
        const allContainers = document.querySelectorAll(`#${containerId}`);
        if (allContainers.length > 1) {
            console.warn(`Duplicate containers found for ${containerId}. Cleaning up.`);
            allContainers.forEach((container, index) => {
                if (index > 0) container.remove(); // Keep the first, remove duplicates
            });
        }
    } catch (error) {
        console.error(`Failed to create and add row for ${label}:`, error);
    }
}

function setupRows() {
    console.log('setupRows called');
    rows = []; // Clear the rows array
    const palettesSection = document.querySelector('.palettes-section');
    if (palettesSection) {
        console.log('Clearing palettes section');
        palettesSection.innerHTML = ''; // Clear all previous rows
    } else {
        console.error('Palettes section not found');
        return;
    }

    // Create and add rows
    console.log('Creating Primary Scales Row');
    const primaryScalesRow = ScalesRow.create(primaryColor, { steps: 10 }, 'Primary Scales');
    primaryScalesRow.isPrimaryBased = true;
    createAndAddRow(primaryScalesRow, 'Primary Scales', 'scalesrow');

    console.log('Creating Secondary Scales Row');
    const secondaryScalesRow = ScalesRow.create(secondaryColor, { steps: 10 }, 'Secondary Scales');
    secondaryScalesRow.isPrimaryBased = false;
    createAndAddRow(secondaryScalesRow, 'Secondary Scales', 'scalesrow');

    console.log('Creating Neutral Scales Row');
    const neutralScalesRow = ScalesRow.create(primaryColor, {
        steps: 10,
        isNeutral: true,
        neutralChroma: 5,
    }, 'Neutral Scales');
    createAndAddRow(neutralScalesRow, 'Neutral Scales', 'scalesrow', true);

    console.log('Creating Harmony Rows');
    const harmonyWideCircRow = HarmonicColorRow.create(primaryColor, secondaryColor, {
        steps: 6,
        interpolation: 'linear',
        lightnessEase: 'linear',
        chromaEase: 'linear',
        huePath: 'longer',
    }, 'Hue wider segment');
    createAndAddRow(harmonyWideCircRow, 'Hue wider segment', 'harmonyrow');

    const harmonyNarrowCircRow = HarmonicColorRow.create(primaryColor, secondaryColor, {
        steps: 6,
        interpolation: 'linear',
        lightnessEase: 'linear',
        chromaEase: 'linear',
        huePath: 'shorter',
    }, 'Hue narrower segment');
    createAndAddRow(harmonyNarrowCircRow, 'Hue narrower segment', 'harmonyrow');

    const harmonyFullCircRow = HarmonicColorRow.create(primaryColor, secondaryColor, {
        steps: 6,
        interpolation: 'linear',
        lightnessEase: 'linear',
        chromaEase: 'linear',
        huePath: 'full-circle',
    }, 'Full circumference');
    createAndAddRow(harmonyFullCircRow, 'Full circumference', 'harmonyrow');

    // Add TertiaryRow conditionally
    console.log('Creating Tertiary Row if conditions are met');
    if (primaryColor && secondaryColor && primaryColor.isReady && secondaryColor.isReady) {
        const tertiaryRow = TertiaryRow.create(primaryColor, secondaryColor, { steps: 10 }, 'Tertiary Row');
        if (tertiaryRow) {
            createAndAddRow(tertiaryRow, 'Tertiary Row', 'tertiaryrow');
        }
    } else {
        console.warn('Tertiary Row creation skipped due to invalid primary or secondary color.');
    }

    colorManager.addObserver({
        update: (data) => {
            if (data.primaryColor && data.secondaryColor) {
                console.log("Observer: TertiaryRow dependencies are ready.");
                const tertiaryRowExists = rows.some(row => row.label === 'Tertiary Row');
                if (!tertiaryRowExists) {
                    console.log("Creating Tertiary Row from observer");
                    const tertiaryRow = TertiaryRow.create(data.primaryColor, data.secondaryColor, { steps: 10 }, 'Tertiary Row');
                    if (tertiaryRow) {
                        createAndAddRow(tertiaryRow, 'Tertiary Row', 'tertiaryrow');
                    }
                }
            }
        }
    });

    // Add icons to rows
    appendIconToRow('Hue wider segment', iconLongRange);
    appendIconToRow('Hue narrower segment', iconShortRange);
    appendIconToRow('Full circumference', iconFullRange);
}

function conditionallyCreateRow(condition, createFunction) {
    if (condition()) {
        console.log('Condition met. Creating row.');
        createFunction();
    } else {
        console.warn('Condition not met. Adding observer to retry.');
        colorManager.addObserver({
            update: (data) => {
                if (condition()) {
                    console.log('Condition met after update. Creating row.');
                    createFunction();
                }
            },
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    appendIconToRow("Hue wider segment", iconLongRange);
    appendIconToRow("Hue narrower segment", iconShortRange);
    appendIconToRow("Full circumference", iconFullRange);
});
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

function handlePrimaryColorInput(event) {
    let value = event.target.value;

    // Step 1: Keep only the first `#` and remove any others
    if (value.startsWith('#')) {
        value = '#' + value.slice(1).replace(/#/g, '');  // Remove all additional `#`
    } else {
        value = '#' + value.replace(/#/g, ''); // Add a single leading `#`
    }

    // Step 2: Enforce a max length of 7 characters (including #)
    value = value.slice(0, 7);

    // Step 3: Update the input field with sanitized value
    event.target.value = value;

    // Step 4: Only update color if it matches a valid hex format
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
        colorUtils.updateContrastStatus(primaryColor, secondaryColor);

    } catch (error) {
        console.error("Invalid color value:", error);
    }
    updateContrastCheck();
}

// Updated function to update all UI elements
function updateUIElements() {
    
    // Validate primaryColor, secondaryColor, and tertiaryColor
    if (!primaryColor || !primaryColor.lch) {
        console.error('Invalid primaryColor in updateUIElements:', primaryColor);
        return;
    }
    if (!secondaryColor || !secondaryColor.lch) {
        console.error('Invalid secondaryColor in updateUIElements:', secondaryColor);
        return;
    }
    if (!tertiaryColor || !tertiaryColor.lch) {
        console.warn('Missing or invalid tertiaryColor. Generating from secondaryColor.');
        tertiaryColor = colorUtils.relateColor(
            secondaryColor,
            secondaryColor.lch.l,
            Math.max(secondaryColor.lch.c, 5), // Ensure minimum chroma
            (secondaryColor.lch.h + 120) % 360
        );
    }
    

    // Update CSS variables
    document.documentElement.style.setProperty('--color-primary', primaryColor.to('srgb').toString({ format: "hex" }));
    document.documentElement.style.setProperty('--color-secondary', secondaryColor.to('srgb').toString({ format: "hex" }));
    if (tertiaryColor) {
        document.documentElement.style.setProperty('--color-tertiary', tertiaryColor.to('srgb').toString({ format: "hex" }));
    }

    // Update primary color inputs
    document.getElementById('color-input').value = primaryColor.to('srgb').toString({ format: "hex" });
    updateColorPickerAppearance(primaryColor.to('srgb').toString({ format: "hex" }));

    // Update secondary color display
    updateSecondaryColorDisplay();

    // Update UI controls for secondary color
    updateSecondaryColorControls();

    // Update all rows (both ScalesRow and HarmonicColorRow)
    if (rows) {
        rows.forEach((item, index) => {
            try {
                if (item.row && typeof item.row.update === 'function') {
                    console.log(`Updating row ${index}:`, item.row);
                    // Pass tertiaryColor along with primary and secondary
                    item.row.update(primaryColor, secondaryColor, tertiaryColor);
                } else {
                    console.warn(`Row ${index} does not have a valid update method:`, item.row);
                }
            } catch (error) {
                console.error(`Error updating row ${index}:`, error);
            }
        });
    }

    // Update contrast status
    colorUtils.updateContrastStatus(primaryColor, secondaryColor, tertiaryColor);

    // Log warnings for zero chroma
    if (secondaryColor.lch.c === 0) {
        console.warn('Warning: Secondary color chroma is zero');
    }
    if (tertiaryColor && tertiaryColor.lch.c === 0) {
        console.warn('Warning: Tertiary color chroma is zero');
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
        case 'complementary': 
            hueDif = 179.5; 
            iconShortRange = iconSvgCompShort;
            iconLongRange = iconSvgCompLong;
            break; 
        case 'triad': 
            hueDif = 120; 
            iconShortRange = iconSvgTriadShort;
            iconLongRange = iconSvgTriadLong;
            break;
        case 'quad': 
            hueDif = 60; 
            iconShortRange = iconSvgQuadShort;
            iconLongRange = iconSvgQuadLong;
            break;
        case 'analogous': 
            hueDif = 30; 
            iconShortRange = iconSvgAnaShort;
            iconLongRange = iconSvgAnaLong;
            break;
    }
    appendIconToRow("Hue wider segment", iconLongRange);
    appendIconToRow("Hue narrower segment", iconShortRange);
    appendIconToRow("Full circumference", iconFullRange)

    // Calculate new secondary color
    const newSecondaryColor = recalculateSecondaryColor(primaryColor, hueDif, secondaryColor);

    if (!newSecondaryColor || !newSecondaryColor.lch || typeof newSecondaryColor.lch.h === 'undefined') {
        console.error('Invalid secondary color calculated:', newSecondaryColor);
        return;
    }

    secondaryColor = newSecondaryColor;

    // Log secondary color for debugging
    console.log('Setting new secondary color:', secondaryColor);

    // Update secondary color in ColorManager
    colorManager.setSecondaryColor(secondaryColor);

    // Keep other functionalities intact
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
        console.error('Primary color is not set.');
        return;
    }

    const chromaSlider = document.getElementById('chroma-slider');
    const lightnessSlider = document.getElementById('lightness-slider');

    if (!chromaSlider || !lightnessSlider) {
        console.error('Chroma or Lightness slider not found.');
        return;
    }

    const chroma = parseInt(chromaSlider.value);
    const lightness = parseInt(lightnessSlider.value);
    const newSecondaryColor = colorUtils.relateColor(
        primaryColor,
        lightness,
        chroma,
        colorUtils.setHue(primaryColor.lch.h, hueDif)
    );

    if (!newSecondaryColor || !newSecondaryColor.lch) {
        console.error('Failed to calculate secondary color:', newSecondaryColor);
        return;
    }

    secondaryColor = newSecondaryColor;
    colorManager.setSecondaryColor(secondaryColor);
    updateUIElements();
    updateAllScalesRows(primaryColor, secondaryColor);
    updateContrastCheck();
}


const secondaryColorObserver = {
    update(data) {
        const { secondaryColor } = data;
        if (secondaryColor) {
            const secondarySwatch = document.querySelector('#secondary-color .color-ticker');
            if (secondarySwatch) {
                const hexColor = secondaryColor.to('srgb').toString({ format: 'hex' });
                secondarySwatch.style.backgroundColor = hexColor;
                secondarySwatch.setAttribute('aria-label', `Secondary color: ${hexColor}`);
            }
        }
    }
};

// Register the observer with ColorManager
colorManager.addObserver(secondaryColorObserver);


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
    const foregroundColor = getComputedStyle(document.body).color; // Example fallback
    const backgroundColor = getComputedStyle(document.body).backgroundColor;
    const ratio = colorUtils.updateContrastStatus(foregroundColor, backgroundColor);
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


/* generate Sharable URL */
function generateShareableURL() {
    const params = new URLSearchParams();

    // Capture the primary color from #color-input
    const primaryColorInput = document.getElementById('color-input');
    if (primaryColorInput) {
        const primaryColorValue = primaryColorInput.value;
        params.set('primaryColor', primaryColorValue);
    }

    // Capture the selected hue difference (hueDif) from seg-ctrl and set the numeric value
    const selectedSegCtrl = document.querySelector('.seg-ctrl input:checked');
    if (selectedSegCtrl) {
        let hueDifValue;
        switch (selectedSegCtrl.value) {
            case 'complementary':
                hueDifValue = 179.5;
                break;
            case 'triad':
                hueDifValue = 120;
                break;
            case 'quad':
                hueDifValue = 60;
                break;
            case 'analogous':
                hueDifValue = 30;
                break;
            default:
                hueDifValue = 0;  // Fallback
        }
        params.set('hueDif', hueDifValue);
    }

    // Capture chroma and lightness slider values
    const chromaSlider = document.getElementById('chroma-slider');
    const lightnessSlider = document.getElementById('lightness-slider');
    if (chromaSlider && lightnessSlider) {
        params.set('chroma', chromaSlider.value);
        params.set('lightness', lightnessSlider.value);
    }

    // Capture the state of the chroma toggle
    const chromaToggle = document.getElementById('chroma-toggle-checkbox');
    if (chromaToggle) {
        params.set('chromaToggle', chromaToggle.checked ? 'on' : 'off');
    }

    // Create the full URL with query parameters
    const shareableURL = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    navigator.clipboard.writeText(shareableURL)
        .then(() => {
            const shareButton = document.getElementById('generate-shareable-url-button'); // Confirm correct button ID
            if (shareButton) {
                const originalText = shareButton.innerHTML;
                shareButton.innerHTML = "Theme URL copied to clipboard!";

                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                }, 1500);
            } else {
                console.error("Button not found: Check ID or DOM timing.");
            }
        })
        .catch(err => {
            console.error('Error copying URL to clipboard:', err);
        });
}


// Add event listener for the share button

document.addEventListener("DOMContentLoaded", () => {
    // Attach event listener to share button
    const shareButton = document.getElementById('generate-shareable-url-button');
    if (shareButton) {
        shareButton.addEventListener("click", generateShareableURL);
    } else {
        console.error("Share button not found after DOM load.");
    }

    // Initialize primary and secondary colors
    try {
        const initialPrimaryColor = new Color('lch', [50, 50, 0]); // Default primary color
        const initialSecondaryColor = new Color('lch', [60, 40, 30]); // Default secondary color
        
        colorManager.setPrimaryColor(initialPrimaryColor);
        colorManager.setSecondaryColor(initialSecondaryColor);

        // Ensure both colors are valid before proceeding
        if (!initialPrimaryColor || !initialPrimaryColor.lch) {
            throw new Error("Primary color initialization failed.");
        }
        if (!initialSecondaryColor || !initialSecondaryColor.lch) {
            throw new Error("Secondary color initialization failed.");
        }

        // Setup rows and UI
        setupRows();
        updateUIElements();
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});




document.addEventListener('DOMContentLoaded', init);


