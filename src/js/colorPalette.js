/* 
Calculation of scales and harmony palettes,
 based on selected primary and secondary colors 
 */

import * as colorUtils from './colorUtils.js';
import { createColorSwatches } from './uiManager.js';
import { copyToClipboard } from './uiManager.js';

console.log('colorUtils log: '+ colorUtils);
class BaseColorRow {
    constructor(config) {
        this.config = {
            steps: 5,
            interpolation: 'linear',
            lightnessEase: 'linear',
            chromaEase: 'linear',
            huePath: 'shorter',
            ...config
        };
        this.colors = [];
        this.sourceColor = null;
        this.containerId = null;
        this.contrastRatios = [];
        this.contrastMarkers = [];
    }

    /**
     * Updates the row with the provided colors.
     * Shared update logic for source color validation and configuration updates.
     */
    update(sourceColor) {
        if (!sourceColor || !sourceColor.lch) {
            console.error('Invalid sourceColor in BaseColorRow.update:', sourceColor);
            return;
        }

        if (!this.sourceColor || !this.sourceColor.equals(sourceColor)) {
            this.sourceColor = sourceColor;
            this.config.startPoint = { ...this.config.startPoint, h: sourceColor.lch.h };
            this.config.endPoint = { ...this.config.endPoint, h: sourceColor.lch.h };
            this.generateColors();
            this.calculateContrastInfo();
            this.updateSwatches();
        }
    }

    /**
     * Generate a color palette based on the row's configuration.
     * Subclasses can extend this for specific generation logic.
     */
    generateColors() {
        const { steps, interpolation, lightnessEase, chromaEase, huePath } = this.config;

        if (!this.sourceColor || !this.sourceColor.lch) {
            console.error('BaseColorRow: sourceColor is invalid for color generation');
            return;
        }

        // Example linear interpolation logic for colors
        this.colors = new Array(steps).fill(null).map((_, i) => {
            const t = i / (steps - 1);
            const l = this.interpolate(this.config.startPoint.l, this.config.endPoint.l, t, lightnessEase);
            const c = this.interpolate(this.config.startPoint.c, this.config.endPoint.c, t, chromaEase);
            const h = this.interpolate(this.config.startPoint.h, this.config.endPoint.h, t, huePath);
            return new colorUtils.Color('lch', [l, c, h]);
        });
    }

    calculateContrastInfo() {
        if (!this.colors || this.colors.length === 0) {
            console.log('No colors available for contrast calculation');
            return;
        }
    
        const lightestColor = this.colors[this.colors.length - 1];  // Assume the last color is the lightest
        console.log('Lightest Color:', lightestColor);
    
        // Step 1: Calculate contrast ratios
        this.contrastRatios = this.colors.map(color => color.contrast(lightestColor, "WCAG21"));
        console.log('Contrast Ratios:', this.contrastRatios);
    
        // Step 2: Reset contrast markers
        this.contrastMarkers = new Array(this.colors.length).fill('');
    
        // Step 3: Find indices for each level
        const aaaIndex = this.contrastRatios.findLastIndex(ratio => ratio >= 7);
        const aaIndex = this.contrastRatios.findLastIndex(ratio => ratio >= 4.5);
        const aa18Index = this.contrastRatios.findLastIndex(ratio => ratio >= 3);
    
        console.log('AAA Index:', aaaIndex, 'AA Index:', aaIndex, 'AA18 Index:', aa18Index);
    
        // Step 4: Assign markers, ensuring no overwrites
        if (aa18Index !== -1 && aa18Index !== aaIndex && aa18Index !== aaaIndex) {
            this.contrastMarkers[aa18Index] = 'AA18';
        }
        if (aaIndex !== -1 && aaIndex !== aaaIndex) {
            this.contrastMarkers[aaIndex] = 'AA';
        }
        if (aaaIndex !== -1) {
            this.contrastMarkers[aaaIndex] = 'AAA';
        }
    
        console.log('Contrast Markers:', this.contrastMarkers);
    };
    
    
    

    /**
     * Updates the swatches in the UI with the generated palette.
     */
    updateSwatches() {
        if (!this.containerId || !this.colors) {
        console.error('Cannot update swatches: containerId or colors are missing', this);
        return;
    }

    console.log('Updating swatches for containerId:', this.containerId);
    console.log('Colors for swatches:', this.colors);
    console.log('Contrast Markers:', this.contrastMarkers);

    // Add delay to ensure DOM updates are not blocked
    setTimeout(() => {
        const srgbColors = this.colors.map(color => color.to('srgb'));
        console.log('sRGB Colors:', srgbColors);

        // Pass data to the swatch creation function
        createColorSwatches(srgbColors, this.containerId, this.contrastRatios, this.contrastMarkers);

        // Verify primary and secondary color markers
        this.markPrimarySecondaryColors();
    }, 0);
    }

    /**
     * Helper method for interpolating values.
     */
    interpolate(start, end, t, easing) {
        // Implement easing functions as needed
        return colorUtils.interpolate(start, end, t, easing);
    }

    /**
     * Marks primary and secondary colors in the swatches.
     * Subclasses can override this for additional markings.
     */
    markPrimarySecondaryColors() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Container not found for marking swatches:', this.containerId);
            return;
        }

        const swatches = container.querySelectorAll('.color-swatch');
        const sourceHex = this.sourceColor.to('srgb').toString({ format: 'hex' });

        swatches.forEach((swatch, index) => {
            swatch.classList.remove('swatch-marked');
            const currentColor = this.colors[index].to('srgb').toString({ format: 'hex' });
            if (currentColor === sourceHex) {
                swatch.classList.add('swatch-marked');
            }
        });
    }

    createChromaToggle() {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-comp neutral-chroma-toggle';
        toggleContainer.innerHTML = `
            <span id="chroma-toggle-label">| Chroma</span>
            <label class="switch">
                <input type="checkbox" id="chroma-toggle-checkbox" class="toggle-checkbox" 
                       ${this.config.neutralChroma > 0 ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
        `;
    
        const checkbox = toggleContainer.querySelector('input');
        checkbox.addEventListener('change', () => {
            this.config.neutralChroma = checkbox.checked ? 5 : 0;
            this.generateScale();
            this.calculateContrastInfo(); // Add this line
            this.updateSwatches();

        });
    
        return toggleContainer;
    }
    
}


function createRow(type, config) {
    switch (type) {
        case 'scales':
            return new ScalesRow(config);
        case 'harmony':
            return new HarmonicColorRow(config);
        case 'tertiary':
            return new TertiaryRow(config);
        default:
            throw new Error(`Unknown row type: ${type}`);
    }
}


export class ScalesRow extends BaseColorRow {
    constructor(sourceColor, config = {}) {
        super({
            steps: 7,
            startPoint: { l: 2, c: 0, h: sourceColor ? sourceColor.lch.h : 0 },
            endPoint: { l: 95, c: 0, h: sourceColor ? sourceColor.lch.h : 0 },
            interpolation: 'linear',
            includeSource: true,
            isNeutral: false,
            neutralChroma: 5,
            ...config,
        });

        this.sourceColor = sourceColor;
        this.scale = []; // Holds the generated scale colors

        // Generate the initial scale
        this.generateScale();
        this.calculateContrastInfo(); // Add this line
        this.updateSwatches();

    }

    /**
     * Updates the row with the current primary or secondary color.
     */
    update(primaryColor, secondaryColor) {
        // Assign the correct source color
        this.sourceColor = this.isPrimaryBased ? primaryColor : secondaryColor;
    
        if (!this.sourceColor || !this.sourceColor.lch) {
            console.error(`Invalid sourceColor in ScalesRow.update (${this.isPrimaryBased ? 'Primary' : 'Secondary'}):`, this.sourceColor);
            return;
        }
    
        console.log(`Updating ScalesRow (${this.isPrimaryBased ? 'Primary' : 'Secondary'}):`, this.sourceColor);

        setTimeout(() => {
            const srgbColors = this.colors.map(color => color.to('srgb'));
            createColorSwatches(srgbColors, this.containerId, this.contrastRatios, this.contrastMarkers);
            this.markPrimarySecondaryColors();
        }, 0);

        // Update start and end points with the correct hue
        this.config.startPoint.h = this.sourceColor.lch.h;
        this.config.endPoint.h = this.sourceColor.lch.h;
    
        // Regenerate the scale and refresh swatches
        this.generateScale();
        this.calculateContrastInfo();
        this.updateSwatches();

        
    }

    generateScale() {
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
            chromaEase: 'constant',
            huePath: 'constant',
        });
    
        console.log('Generated scale for ScalesRow:', this.scale);
        this.colors = this.scale; // Sync with BaseColorRow's colors
        
    }
    

    /**
     * Creates a swatches container for the row.
     */
    createSwatches(containerIdPrefix = 'color-scale', label = '', isNeutral = false) {
        // Prevent duplicate creation by checking if the container already exists
        if (!this.containerId) {
            this.containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
        } else if (document.getElementById(this.containerId)) {
            console.warn(`Swatches already exist for ${this.containerId}. Skipping creation.`);
            this.updateSwatches(); // Update swatches instead of creating new ones
            return;
        }
    
        const palettesSection = document.querySelector('.palettes-section');
        if (!palettesSection) {
            console.error('Palettes section not found');
            return;
        }
    
        // Create wrapper for label, chroma toggle, and JSON button
        const labelButtonContainer = document.createElement('div');
        labelButtonContainer.className = 'label-button-container';
        labelButtonContainer.style.display = 'flex';
        labelButtonContainer.style.justifyContent = 'space-between';
        labelButtonContainer.style.alignItems = 'center';
    
        // Create and append the label
        if (label) {
            const labelElement = document.createElement('h4');
            labelElement.textContent = label;
            labelElement.className = 'palette-label heading-04';
            labelButtonContainer.appendChild(labelElement);
        }
    
        // Add chroma toggle for neutral palettes
        if (isNeutral) {
            const chromaToggle = this.createChromaToggle();
            labelButtonContainer.appendChild(chromaToggle);
        }
    
        // Add "Copy as JSON" button
        const copyJsonButton = document.createElement('button');
        copyJsonButton.textContent = 'Copy as JSON';
        copyJsonButton.className = 'copy-json-button';
        copyJsonButton.addEventListener('click', () => {
            const jsonData = this.getSwatchesAsJson();
            copyToClipboard(jsonData, copyJsonButton);
        });
        labelButtonContainer.appendChild(copyJsonButton);
    
        // Append the label-button container to the palettes section
        //palettesSection.appendChild(labelButtonContainer);
    
        // Create swatches container
        const container = document.createElement('div');
        container.id = this.containerId;
        container.classList.add('color-swatch-container', 'scale-swatch-container'); 
    
        // Generate and update swatches
        this.updateSwatches();
    }
    
    
    

    /**
     * Static method to create a ScalesRow instance.
     */
    static create(sourceColor, config = {}, label = 'Scale Row') {
        if (!sourceColor) {
            console.warn('ScalesRow.create: sourceColor is undefined or null');
            sourceColor = new colorUtils.Color('lch', [50, 1, 0]); // Default color with non-zero chroma
        }

        if (sourceColor.lch.c === 0) {
            console.warn('Source color has zero chroma, adjusting');
            sourceColor = new colorUtils.Color('lch', [sourceColor.lch.l, 1, sourceColor.lch.h]);
        }

        const row = new ScalesRow(sourceColor, config);
        row.createSwatches('scalesrow', label, config.isNeutral);
        return row;
    }
}

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
   // palettesSection.appendChild(labelButtonContainer);

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

export class TertiaryRow extends BaseColorRow {
    constructor(primaryColor, secondaryColor, tertiaryColor, config = {}) {
        super({
            steps: 7,
            interpolation: 'linear',
            lightnessEase: 'linear',
            chromaEase: 'linear',
            huePath: 'shorter',
            ...config,
        });

        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.tertiaryColor = tertiaryColor;

        // Generate the initial colors
        this.generateColors();
        this.calculateContrastInfo();
        this.updateSwatches();
    }

    update(primaryColor, secondaryColor, tertiaryColor) {
        if (!primaryColor || !secondaryColor || !tertiaryColor) {
            console.error('Invalid colors provided for TertiaryRow update');
            return;
        }

        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.tertiaryColor = tertiaryColor;

        this.generateColors();
        this.calculateContrastInfo();
        this.updateSwatches();
    }

    static create(primaryColor, secondaryColor, tertiaryColor, config, label) {
        const instance = new TertiaryRow(config);
        instance.primaryColor = primaryColor;
        instance.secondaryColor = secondaryColor;
        instance.tertiaryColor = tertiaryColor;
        instance.generateColors(); // Populate colors array
        console.log(`TertiaryRow created with label: ${label}`);
        return instance;
    }

    generateColors() {
        // Ensure required colors are available
        if (!this.primaryColor || !this.secondaryColor || !this.tertiaryColor) {
            console.error('TertiaryRow.generateColors: Missing required colors');
            return;
        }
    
        console.log('Generating colors for TertiaryRow with:', {
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            tertiaryColor: this.tertiaryColor,
        });
    
        const { steps, interpolation = 'linear' } = this.config;
        const midpoint = Math.floor(steps / 2);
        this.colors = Array(steps).fill(null);
    
        // Assign fixed positions for primary, secondary, and tertiary colors
        this.colors[0] = this.secondaryColor;
        this.colors[midpoint] = this.primaryColor;
        this.colors[steps - 1] = this.tertiaryColor;
    
        console.log('Assigned fixed colors:', {
            secondaryColor: this.secondaryColor,
            primaryColor: this.primaryColor,
            tertiaryColor: this.tertiaryColor,
        });
    
        // Interpolate colors between secondary and primary
        for (let i = 1; i < midpoint; i++) {
            const t = i / midpoint; // Interpolation factor
            this.colors[i] = colorUtils.interpolateColor(
                this.secondaryColor.lch,
                this.primaryColor.lch,
                t,
                interpolation
            );
        }
    
        // Interpolate colors between primary and tertiary
        for (let i = midpoint + 1; i < steps - 1; i++) {
            const t = (i - midpoint) / (steps - 1 - midpoint); // Interpolation factor
            this.colors[i] = colorUtils.interpolateColor(
                this.primaryColor.lch,
                this.tertiaryColor.lch,
                t,
                interpolation
            );
        }
    
        // Validate that interpolation function exists
        if (!colorUtils.interpolateColor) {
            console.error('interpolateColor function is missing or not imported correctly from colorUtils.js');
        }
    
        console.log('Generated TertiaryRow Colors:', this.colors);
    }
    
    updateSwatches() {
        if (!this.containerId || !this.colors) {
            console.error('Cannot update swatches: containerId or colors are missing in TertiaryRow');
            return;
        }
        console.log('Creating swatches for TertiaryRow:', containerId, colors);
        console.log('Colors for swatches:', this.colors);
    
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container not found for containerId: ${this.containerId}`);
            return;
        }
    
        container.innerHTML = ''; // Clear existing swatches
    
        this.colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.to('srgb').toString();
            container.appendChild(swatch);
        });

    }
    
    markPrimaryTertiaryColors() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const swatches = container.querySelectorAll('.color-swatch');
        const sourceHex = this.sourceColor.to('srgb').toString({ format: 'hex' });

        swatches.forEach((swatch, index) => {
            swatch.classList.remove('swatch-marked');
            const currentColor = this.scale[index].to('srgb').toString({ format: 'hex' });
            if (currentColor === sourceHex) {
                swatch.classList.add('swatch-marked');
            }
        });
    }

    createSwatches(containerId, label) {
        if (!containerId || !this.colors) {
            console.error(`Cannot update swatches: containerId or colors are missing in TertiaryRow`);
            console.log('containerId:', containerId, 'colors:', this.colors);
            return;
        }
        console.log('Creating swatches for TertiaryRow:', containerId, this.colors);
    
        const palettesSection = document.querySelector('.palettes-section');
        if (!palettesSection) {
            console.error('Palettes section not found');
            return;
        }
    
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'color-swatch-container tertiary-swatch-container';
            palettesSection.appendChild(container);
        }
    
        console.log('Creating swatches for TertiaryRow:', label, `containerId: ${containerId}`);
        this.updateSwatches();
    }
    
    getSwatchesAsJson() {
        const swatchData = this.scale.map((color, index) => ({
            [`tertiary-${index}`]: color.to('srgb').toString({ format: 'hex' }),
        }));
        return JSON.stringify(swatchData, null, 2);
    }
   
    static create(primaryColor, secondaryColor, tertiaryColor, config = {}, label = "Tertiary Row") {
        if (!tertiaryColor || !tertiaryColor.lch) {
            console.warn("TertiaryRow.create: Invalid or missing tertiaryColor. Falling back.");
            tertiaryColor = new colorUtils.Color('lch', [50, 0, 180]);
        }

        const row = new TertiaryRow(primaryColor, secondaryColor, tertiaryColor, config);
        row.createSwatches('tertiaryrow', label);
        return row;
    }
}

