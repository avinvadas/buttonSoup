/* 
Calculation of scales and harmony palettes,
 based on selected primary and secondary colors 
 */

import * as colorUtils from './colorUtils.js';
import { createColorSwatches } from './uiManager.js';
import { copyToClipboard } from './uiManager.js';
/* ScaleRow object | Generating a scale-based palette: */
export function ScalesRow(sourceColor, config = {}) {
    this.sourceColor = sourceColor;
    this.isPrimaryBased = true;

    /* palette settings:*/
    this.config = {
        steps: 7,
        startPoint: { l: 2, c: 0, h: sourceColor ? sourceColor.lch.h : 0 },
        endPoint: { l: 95, c: 0, h: sourceColor ? sourceColor.lch.h : 0 },
        interpolation: 'linear',
        includeSource: true,
        isNeutral: false,
        neutralChroma: 5,
        ...config
    };


    this.scale = []; /* scales array */
    this.containerId = null;
    this.contrastRatios = []; /* Contrast ratios for each swatch */
    this.contrastMarkers = []; /* Contrast markers across the palette: AA18, AA, AAA */
    this.colors = []; 
    this.generateScale();
}

/* Generate the scales */
ScalesRow.prototype.generateScale = function() {
    
    const { steps, startPoint, endPoint, interpolation, includeSource, isNeutral, neutralChroma } = this.config;
    this.scale = colorUtils.generateColorScale(this.sourceColor, {
        steps,
        startPoint: { l: startPoint.l, c: this.sourceColor.lch.c, h: this.sourceColor.lch.h },
        endPoint: { l: endPoint.l, c: this.sourceColor.lch.c, h: this.sourceColor.lch.h },
        interpolation,
        includeSource,
        isNeutral,
        neutralChroma,
        lightnessEase: interpolation,
        chromaEase: 'constant',  // This ensures chroma remains constant across the scale
        huePath: 'constant'  // This ensures hue remains constant across the scale
    });
    
    this.calculateContrastInfo();
};

/* WCAG contrast calculation to set ratio and success criteria stops across the palette: */
ScalesRow.prototype.calculateContrastInfo = function() {
    if (!this.scale || this.scale.length === 0) return;
    const lightestColor = this.scale[this.scale.length - 1];  // Assuming the lightest color is the last in the array
    this.contrastRatios = this.scale.map(color => color.contrast(lightestColor, "WCAG21"));
    this.contrastMarkers = new Array(this.scale.length).fill('');

    // Find the indices of colors meeting each criterion, starting from the brightest (end of the array)
    let aaaIndex = this.contrastRatios.findLastIndex(ratio => ratio >= 7);
    let aaIndex = this.contrastRatios.findLastIndex(ratio => ratio >= 4.5);
    let aa18Index = this.contrastRatios.findLastIndex(ratio => ratio >= 3);

    // Set markers, ensuring we don't overwrite a higher-level marker
    if (aa18Index !== -1 && aa18Index !== aaIndex && aa18Index !== aaaIndex) {
        this.contrastMarkers[aa18Index] = 'AA18';
    }
    if (aaIndex !== -1 && aaIndex !== aaaIndex) {
        this.contrastMarkers[aaIndex] = 'AA';
    }
    if (aaaIndex !== -1) {
        this.contrastMarkers[aaaIndex] = 'AAA';
    }
};

/* Update scales spread */
ScalesRow.prototype.update = function (primaryColor, secondaryColor) {
    console.log('Updating ScalesRow with:', { primaryColor, secondaryColor });

    const sourceColor = this.isPrimaryBased ? primaryColor : secondaryColor;

    if (!sourceColor || !sourceColor.lch) {
        console.error('Invalid sourceColor in ScalesRow.update:', sourceColor);
        return;
    }

    if (!this.sourceColor || !this.sourceColor.equals(sourceColor)) {
        this.sourceColor = sourceColor;
        this.config.startPoint.h = sourceColor.lch.h;
        this.config.endPoint.h = sourceColor.lch.h;
        this.generateScale();
        this.calculateContrastInfo();
        this.updateSwatches();
    }
};


/* Update the palette & swatches */
ScalesRow.prototype.updateSwatches = function() {
    if (this.containerId && this.scale) {
        this.calculateContrastInfo();  
        setTimeout(() => {
            const srgbColors = this.scale.map(color => color.to('srgb'));
            createColorSwatches(srgbColors, this.containerId, this.contrastRatios, this.contrastMarkers);
            this.markPrimarySecondaryColors();
        }, 0);
    } else {
        console.error(`Cannot update swatches: containerId or scale is missing`, this);
    }
};

/* Chroma toggle for neutral scales palette */
ScalesRow.prototype.createChromaToggle = function() {
    

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toggle-comp neutral-chroma-toggle';
    toggleContainer.innerHTML = `
    <span id="chroma-toggle-label">| Chroma</span>
        <label class="switch">
            <input type="checkbox" id="chroma-toggle-checkbox" 
                   class="toggle-checkbox"
                   ${this.config.neutralChroma > 0 ? 'checked' : ''}>
            <span class="slider round"></span>
        </label>
    `;

    const checkbox = toggleContainer.querySelector('input');

    // Step 1: Add URL query parameter handling
    const params = new URLSearchParams(window.location.search);
    if (params.has('chromaToggle')) {
        const chromaToggleValue = params.get('chromaToggle');
        checkbox.checked = (chromaToggleValue === 'on');
        this.config.neutralChroma = checkbox.checked ? 5 : 0; // Set the chroma value based on the toggle state
        
    }

    // Step 2: Add the event listener for changes in the toggle
    checkbox.addEventListener('change', () => {
        this.config.neutralChroma = checkbox.checked ? 5 : 0; // Toggle chroma
        this.generateScale(); // Regenerate the scale based on the chroma toggle
        this.updateSwatches(); // Refresh the swatches
    });

    return toggleContainer;
};



/* Create the container & Swatches */
ScalesRow.prototype.createSwatches = function(containerIdPrefix = 'color-scale', label = '', isNeutral = false) {
    // Prevent creating swatches if already created
    const existingContainer = document.getElementById(this.containerId);
    if (existingContainer) {
        return;
    }

    this.containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
    const palettesSection = document.querySelector('.palettes-section');
    if (!palettesSection) {
        console.error('Palettes section not found');
        return;
    }

    // Create a wrapper for the label, copy button, and chroma toggle
    const labelButtonContainer = document.createElement('div');
    labelButtonContainer.classList.add('label-button-container');
    labelButtonContainer.style.display = 'flex';
    labelButtonContainer.style.justifyContent = 'space-between';
    labelButtonContainer.style.alignItems = 'center';

    // Create and append the label
    if (label) {
        const labelElement = document.createElement('h4');
        labelElement.textContent = label;
        labelElement.classList.add('heading-04', 'palette-label');
        labelButtonContainer.appendChild(labelElement);
    }

    // Add the chroma toggle if this is the neutral palette
    if (isNeutral) {
        const chromaToggle = this.createChromaToggle();
        labelButtonContainer.appendChild(chromaToggle);
    }

    // Create and append the Copy as JSON Button
    const copyJsonButton = document.createElement('button');
    copyJsonButton.textContent = "Copy as JSON";
    copyJsonButton.classList.add('copy-json-button');
    labelButtonContainer.appendChild(copyJsonButton);

    // Append the label-button container to the palettes section
    palettesSection.appendChild(labelButtonContainer);

    // Add event listener for copying JSON
    copyJsonButton.addEventListener('click', () => {
        const jsonPalette = this.getSwatchesAsJson();
        copyToClipboard(jsonPalette, copyJsonButton);
    });

    // Create the swatches container and update swatches
    const container = document.createElement('div');
    container.id = this.containerId;
    container.classList.add('color-swatch-container', 'scale-swatch-container');
    palettesSection.appendChild(container);

    // Generate and update swatches
    this.updateSwatches();
};


ScalesRow.prototype.getSwatchesAsJson = function() {
    const swatchData = this.scale.map((color, index) => {
        return { [`color-${index}`]: color.to('srgb').toString({format: 'hex'}) };
    });
    return JSON.stringify(swatchData, null, 2);
};


/* Marking the primary and secondary color swatches within their adequate scale palettes */
ScalesRow.prototype.markPrimarySecondaryColors = function() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const swatches = container.querySelectorAll('.color-swatch');
    const sourceHex = this.sourceColor.toString({format: "hex"});

    swatches.forEach((swatch, index) => {
        swatch.classList.remove('swatch-marked');
        
        const currentColor = this.scale[index].toString({format: "hex"});

        if (currentColor === sourceHex) {
            swatch.classList.add('swatch-marked');
        }
    });
};

/* Create palette by source color and configurations */
ScalesRow.create = function(sourceColor, config = {}, label = 'Scale Row') {
    if (!sourceColor) {
        console.warn('ScalesRow.create: sourceColor is undefined or null');
        sourceColor = new colorUtils.Color('lch', [50, 1, 0]); // Default color with non-zero chroma
    }

    // Ensure non-zero chroma
    if (sourceColor.lch.c === 0) {
        console.warn('Source color has zero chroma, adjusting');
        sourceColor = new colorUtils.Color('lch', [sourceColor.lch.l, 1, sourceColor.lch.h]);
    }

    // Create a ScalesRow instance
    const row = new ScalesRow(sourceColor, config);

    // Pass the dynamic label instead of hardcoding "Neutral scales"
    row.createSwatches('scalesrow', label, config.isNeutral);

    return row;
};




/* HarmonicColorRow object | Generating a hue- spreaded palette: */
export function HarmonicColorRow(primaryColor, secondaryColor, config = {}) {
    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;

    this.config = {
        steps: 5,
        interpolation: 'linear',
        lightnessEase: 'linear',
        chromaEase: 'linear',
        huePath: 'shorter',
        hueOrder: 'primary-first',
        ...config
    };

    this.colors = [];
    this.contrastRatios = [];
    this.containerId = null;

    this.generateColors();
}

HarmonicColorRow.prototype.generateColors = function() {
    const { steps, interpolation, lightnessEase, chromaEase, huePath } = this.config;
    this.colors = new Array(steps);
    const toHex = (color) => color.to('srgb').toString({format: 'hex'});

    // Calculate hue difference
    let hue1 = this.primaryColor.lch.h;
    let hue2 = this.secondaryColor.lch.h;
    let hueDiff = (hue2 - hue1 + 360) % 360;

    if (huePath === 'full-circle') {
        // Full-circle logic
        for (let i = 0; i < steps; i++) {
            let h = (360 * i / steps + hue1) % 360;
            let t = i / (steps - 1);
            let l = colorUtils.interpolate(this.primaryColor.lch.l, this.secondaryColor.lch.l, t, lightnessEase);
            let c = colorUtils.interpolate(this.primaryColor.lch.c, this.secondaryColor.lch.c, t, chromaEase);

            this.colors[i] = new colorUtils.Color("lch", [l, c, h]); // Store color objects instead of hex for later conversion
        }

        // Ensure primary and secondary colors are included
        const primaryIndex = 0;
        const secondaryIndex = Math.round((hueDiff / 360) * steps) % steps;
        this.colors[primaryIndex] = this.primaryColor;
        this.colors[secondaryIndex] = this.secondaryColor;
    } else {
        // Interpolations across shorter and longer paths of the hue circumference, between the primary and secondary colors
        let shorterPath, longerPath;
        if (hueDiff <= 180) {
            shorterPath = hueDiff;
            longerPath = hueDiff - 360;
        } else {
            shorterPath = hueDiff - 360;
            longerPath = hueDiff;
        }

        let selectedPath = huePath === 'shorter' ? shorterPath : longerPath;

        this.colors[0] = this.primaryColor;
        this.colors[steps - 1] = this.secondaryColor;

        for (let i = 1; i < steps - 1; i++) {
            let t = i / (steps - 1);
            let h = (hue1 + selectedPath * t + 360) % 360;
            let l = colorUtils.interpolate(this.primaryColor.lch.l, this.secondaryColor.lch.l, t, lightnessEase);
            let c = colorUtils.interpolate(this.primaryColor.lch.c, this.secondaryColor.lch.c, t, chromaEase);

            this.colors[i] = new colorUtils.Color("lch", [l, c, h]); // Store color objects instead of hex for consistency
        }
    }
};

/* Update palettes according to color changes */
HarmonicColorRow.prototype.update = function (primaryColor, secondaryColor, tertiaryColor) {
    console.log('Updating HarmonicColorRow with:', { primaryColor, secondaryColor, tertiaryColor });

    if (!primaryColor || !primaryColor.lch) {
        console.error('Invalid primaryColor in HarmonicColorRow.update:', primaryColor);
        return;
    }
    if (!secondaryColor || !secondaryColor.lch) {
        console.error('Invalid secondaryColor in HarmonicColorRow.update:', secondaryColor);
        return;
    }
    if (!tertiaryColor || !tertiaryColor.lch) {
        console.error('Invalid tertiaryColor in HarmonicColorRow.update:', tertiaryColor);
        return;
    }

    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;
    this.tertiaryColor = tertiaryColor;

    this.generateColors();
    this.updateSwatches();
};



HarmonicColorRow.prototype.updateSwatches = function() {
    const container = document.getElementById(this.containerId);
    if (!container) {
        console.error('Container not found for harmony swatches');
        return;
    }

    // Clear existing swatches
    container.innerHTML = '';

    // Convert LCH to Hex and create swatches
    const srgbColors = this.colors.map(color => color.to('srgb').toString({ format: 'hex' }));
    
    // Create swatches using the hex colors
    createColorSwatches(srgbColors, this.containerId, this.contrastRatios);
};

HarmonicColorRow.prototype.createSwatches = function(containerIdPrefix = 'harmony-row', label = '') {
    this.containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
    const palettesSection = document.querySelector('.palettes-section');
    if (!palettesSection) {
        console.error('Palettes section not found');
        return;
    }

    // Create a wrapper for the label and the button
    const labelButtonContainer = document.createElement('div');
    labelButtonContainer.classList.add('label-button-container');
    
    // Create and append the label
    if (label) {
        const labelElement = document.createElement('h4');
        labelElement.textContent = label;
        labelElement.classList.add('heading-04', 'palette-label');
        labelButtonContainer.appendChild(labelElement);
    }

    // Create and append the Copy as JSON Button
    const copyJsonButton = document.createElement('button');
    copyJsonButton.textContent = "Copy as JSON";
    copyJsonButton.classList.add('copy-json-button');
    labelButtonContainer.appendChild(copyJsonButton);

    // Append the label-button container to the palettes section
    palettesSection.appendChild(labelButtonContainer);

    // Event listener for copying to clipboard
    copyJsonButton.addEventListener('click', () => {
        const jsonPalette = this.getSwatchesAsJson(); // Generate the JSON
        copyToClipboard(jsonPalette, copyJsonButton); // Copy to clipboard and handle label change
    });

    // Create and append the swatches container
    const container = document.createElement('div');
    container.id = this.containerId;
    container.classList.add('color-swatch-container', 'harmony-swatch-container');
    palettesSection.appendChild(container);
    
    // Create swatches
    this.updateSwatches();
};


/* Marking the primary and secondary color swatches within their adequate scale palettes */
HarmonicColorRow.prototype.markPrimarySecondaryColors = function() {
    const container = document.getElementById(this.containerId);
    if (!container) {
        console.error('Container not found:', this.containerId);
        return;
    }

    const swatches = container.querySelectorAll('.color-swatch');

    const primaryHex = this.primaryColor.to('srgb').toString({format: "hex"});
    const secondaryHex = this.secondaryColor.to('srgb').toString({format: "hex"});
    swatches.forEach((swatch, index) => {
        swatch.classList.remove('swatch-marked');
        
        const currentColor = this.colors[index];
        if (currentColor === primaryHex || currentColor === secondaryHex) {
            swatch.classList.add('swatch-marked');
        }
    });
};

HarmonicColorRow.prototype.getSwatchesAsJson = function() {
    if (!this.colors || this.colors.length === 0) {
        console.error('Cannot generate JSON: Harmony array is empty or undefined');
        return '{}';  // Return an empty JSON object if the harmony array is not available
    }

    const swatchData = this.colors.map((color, index) => {
        return { [`harmony-palette-${index}`]: color.to('srgb').toString({ format: 'hex' }) }; // Convert to hex at this stage
    });

    return JSON.stringify(swatchData, null, 2);
};




HarmonicColorRow.create = function(primaryColor, secondaryColor, config = {}) {
    const row = new HarmonicColorRow(primaryColor, secondaryColor, config);
    return row;
};