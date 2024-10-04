/*
UI Functionalities and dynamic DOM creation (color palettes)
*/


import * as colorUtils from './colorUtils.js';

export const uiManager = {
    createColorSwatches,
    addSwatchInteractivity,
    showCopiedMessage,
    applyColorPaletteToCSS,
    addColorTickerFunctionality
};

/* Creating color swatches in the palettes */
export function createColorSwatches(colorScale, containerId, contrastRatios, contrastMarkers) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id ${containerId} not found`);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    const isScaleRow = contrastRatios && contrastMarkers;

    colorScale.forEach((color, index) => {
        if (!color) {
            return;
        }
        
        const swatch = document.createElement('div');
        let hexColor = color.toString({format: "hex"});
        
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = hexColor;
        swatch.tabIndex = 0; // Make the swatch focusable
        swatch.setAttribute('role', 'button');
        swatch.setAttribute('aria-label', `Copy color ${hexColor}`);

        // Calculate text color based on contrast
        const textColor = colorUtils.getContrastTextColor(hexColor);
        swatch.style.color = textColor;

        const hexValueContainer = document.createElement('div');
        hexValueContainer.className = 'hex-value-container';

        if (isScaleRow && contrastRatios[index] !== undefined) {
            const ratio = contrastRatios[index];
            const contrastRatio = document.createElement('span');
            contrastRatio.className = 'contrast-ratio';
            contrastRatio.textContent = `${ratio.toFixed(2)}:1`;
            contrastRatio.style.color = textColor;
            hexValueContainer.appendChild(contrastRatio);
        }


        const hexValue = document.createElement('span');
        hexValue.textContent = hexColor;
        hexValue.className = 'hex-value';
        hexValue.id = `hex-value-${containerId}-${index}`;
        hexValue.style.color = textColor;
        hexValueContainer.appendChild(hexValue);

        if (isScaleRow && contrastMarkers[index]) {
            const markerContainer = document.createElement('div');
            markerContainer.className = 'swatch__MarkerContainer';
            
            const contrastMarker = document.createElement('span');
            contrastMarker.className = 'swatch__Marker';
            contrastMarker.textContent = contrastMarkers[index];
            contrastMarker.dataset.level = contrastMarkers[index];
            contrastMarker.style.color = textColor;
            markerContainer.appendChild(contrastMarker);
            
            swatch.appendChild(markerContainer);
        }

        const copyIconElement = createCopyIcon();
        copyIconElement.style.color = textColor;
        const checkIconElement = createCheckIcon();
        checkIconElement.style.color = textColor;
        
        swatch.appendChild(copyIconElement);
        swatch.appendChild(checkIconElement);


        swatch.appendChild(hexValueContainer);

        // Interactions event listeners (Mouse+ Keyboard)
        swatch.addEventListener('mouseenter', () => {
            copyIconElement.style.display = 'block';
            
        });
        
        swatch.addEventListener('mouseleave', () => {
            copyIconElement.style.display = 'none';
            
        });
        
        swatch.addEventListener('focus', () => {
            copyIconElement.style.display = 'block';
           
        });
        
        swatch.addEventListener('blur', () => {
            copyIconElement.style.display = 'none';
            
        });
        
        swatch.addEventListener('click', () => {
            copyColor(hexColor, hexValue, copyIconElement, checkIconElement);
        });
        
        swatch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                copyColor(hexColor, hexValue, copyIconElement, checkIconElement);
            }
        });

        container.appendChild(swatch);
    });
  
    setTimeout(() => {
        const swatches = document.querySelectorAll(`#${containerId} .color-swatch`);
        swatches.forEach((swatch, index) => {
        });
    }, 100);
}

/* Copy-to-clipboard functionality to swatches: */

/* copy icon (on swatch hover/focus) */
function createCopyIcon() {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("width", "2rem");
    icon.setAttribute("height", "2rem");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.classList.add('copy-icon');
    icon.innerHTML = `
        <path class="copy-path" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        <path class="check-path" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" style="display: none;"/>
    `;
    return icon;
}
/* Check icon (on copy success) */
function createCheckIcon() {
    const checkIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    checkIcon.setAttribute("width", "2rem");
    checkIcon.setAttribute("height", "2rem");
    checkIcon.setAttribute("viewBox", "0 0 24 24");
    checkIcon.setAttribute("fill", "none");
    checkIcon.setAttribute("stroke", "currentColor");
    checkIcon.setAttribute("stroke-width", "2");
    checkIcon.setAttribute("stroke-linecap", "round");
    checkIcon.setAttribute("stroke-linejoin", "round");
    checkIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    checkIcon.classList.add('check-icon');
    checkIcon.style.display = 'none';  // Hide by default
    return checkIcon;
}

function addSwatchInteractivity(swatch, hexColor) {
    const hexValue = swatch.querySelector('.hex-value');
    const copyColorFeedback = () => {
        navigator.clipboard.writeText(hexColor).then(() => {
            const originalContent = hexValue.innerHTML;
            hexValue.textContent = 'Copied!';
            setTimeout(() => {
                hexValue.innerHTML = originalContent;
            }, 1500);
        });
    };

    swatch.addEventListener('click', copyColorFeedback);
    swatch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            copyColorFeedback();
        }
    });
}
/* Show 'copied!' instead of the hex value */
function showCopiedMessage(swatch) {
    const copiedMsg = document.createElement('div');
    copiedMsg.textContent = 'Copied!';
    copiedMsg.className = 'copied-message';
    swatch.appendChild(copiedMsg);
    setTimeout(() => copiedMsg.remove(), 1500);
}

function applyColorPaletteToCSS(harmonicRow) {
    const cssVariables = harmonicRow.toCssVariables();
    Object.entries(cssVariables).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
    });
}

function addColorTickerFunctionality(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    // Clear existing content
    element.innerHTML = '';

    /* create container for color value label */
    const hexValueContainer = document.createElement('div');
    hexValueContainer.className = 'hex-value-container';

    /* create color value label */
    const hexValue = document.createElement('span');
    hexValue.className = 'hex-value';

    /* Cerate icons for copy to clipboard interaction */
    const copyIcon = createCopyIcon();
    copyIcon.style.display = 'none';
    const checkIcon = createCheckIcon();
    checkIcon.style.display = 'none';

    /* append all elements to the DOM */
    hexValueContainer.appendChild(hexValue);
    hexValueContainer.appendChild(copyIcon);
    hexValueContainer.appendChild(checkIcon);
    element.appendChild(hexValueContainer);

    /* Function displaying the hex value */
    function updateHexValueAndColor() {
        const bgColor = getComputedStyle(element).backgroundColor; /*Get current color from bg */
        const hexColor = colorUtils.rgbToHex(bgColor); /* convert it to hex */
        hexValue.textContent = hexColor; /* turn the hex into the hexValue content */
        
        /* Setting text color for contrast */
        const textColor = colorUtils.getContrastTextColor(hexColor);
        hexValue.style.color = textColor;
        copyIcon.style.color = textColor;
    }

    updateHexValueAndColor();
    /* Set interaction behavior */

    /* verify tabindex */
    if (!element.hasAttribute('tabindex')) {
        element.tabIndex = 0;
    }
    /* Set mouse and keyboard events */ 
    element.addEventListener('mouseenter', () => {
        copyIcon.style.display = 'block';
    });
    element.addEventListener('mouseleave', () => {
        copyIcon.style.display = 'none';
    });
    element.addEventListener('focus', () => {
        copyIcon.style.display = 'block';
    });
    element.addEventListener('blur', () => {
        copyIcon.style.display = 'none';
    });
    
    element.addEventListener('click', () => copyColor(hexValue.textContent, hexValue, copyIcon));
    element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            copyColor(hexValue.textContent, hexValue, copyIcon);
        }
    });

}

/* Create copyTimeouts object. Used in index.js */
export const copyTimeouts = {};

/* Copy to clipboard function */
function copyColor(hexColor, hexValueElement, copyIcon) {
    navigator.clipboard.writeText(hexColor).then(() => {
        const originalContent = hexValueElement.textContent;
        hexValueElement.textContent = 'Copied!';
        
        const copyPath = copyIcon.querySelector('.copy-path');
        const checkPath = copyIcon.querySelector('.check-path');
        
        // Hide copy icon, show check icon
        copyPath.style.display = 'none';
        checkPath.style.display = 'block';
        copyIcon.style.opacity = '1'; // Make sure the icon is visible

        setTimeout(() => {
            hexValueElement.textContent = originalContent;
            // Show copy icon, hide check icon
            copyPath.style.display = 'block';
            checkPath.style.display = 'none';
            copyIcon.style.opacity = '0.33'; // Reset to hover state opacity
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}