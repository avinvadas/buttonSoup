/* 
Calculation of scales and harmony palettes,
 based on selected primary and secondary colors 
 */
 import * as colorUtils from './colorUtils.js';
import { createColorSwatches } from './uiManager.js';
import * as uiManager  from './uiManager.js';


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

    getSwatchesAsJson() {
        return JSON.stringify(this.colors);
    }

    createLabelButtonContainer(label, isNeutral) {
        const labelButtonContainer = document.createElement('div');
        labelButtonContainer.className = 'label-button-container';
        labelButtonContainer.style.display = 'flex';
        labelButtonContainer.style.justifyContent = 'space-between';
        labelButtonContainer.style.alignItems = 'center';

        if (label) {
            const labelElement = document.createElement('h4');
            labelElement.textContent = label;
            labelElement.className = 'palette-label heading-04';
            labelButtonContainer.appendChild(labelElement);
        }

        if (isNeutral) {
            const chromaToggle = this.createChromaToggle();
            labelButtonContainer.appendChild(chromaToggle);
        }

        const copyJsonButton = document.createElement('button');
        copyJsonButton.textContent = 'Copy as JSON';
        copyJsonButton.className = 'copy-json-button';
        copyJsonButton.addEventListener('click', () => {
            const jsonData = this.getSwatchesAsJson();
            uiManager.copyToClipboard(jsonData, copyJsonButton);
        });
        labelButtonContainer.appendChild(copyJsonButton);

        return labelButtonContainer;
    }

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

    createSwatches(containerIdPrefix = 'color-scale', label = '', isNeutral = false) {
        if (!this.containerId) {
            this.containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
        } else if (document.getElementById(this.containerId)) {
            console.warn(`Swatches already exist for ${this.containerId}. Skipping creation.`);
            this.updateSwatches();
            return;
        }

        const palettesSection = document.querySelector('.palettes-section');
        if (!palettesSection) {
            console.error('Palettes section not found');
            return;
        }

        const labelButtonContainer = this.createLabelButtonContainer(label, isNeutral);
        palettesSection.appendChild(labelButtonContainer);

        const swatchContainer = document.createElement('div');
        swatchContainer.id = this.containerId;
        swatchContainer.className = 'color-swatch-container';

        palettesSection.appendChild(swatchContainer);

        this.updateSwatches();
    }

    generateScale() {
        const { steps, startPoint, endPoint, interpolation, includeSource, isNeutral, neutralChroma } = this.config;
        
        try {
            console.log(`Generating scale with chroma: ${isNeutral ? neutralChroma : this.sourceColor.lch.c}`);
            this.scale = colorUtils.generateColorScale(this.sourceColor, {
                steps,
                startPoint: { l: startPoint.l, c: isNeutral ? neutralChroma : this.sourceColor.lch.c, h: this.sourceColor.lch.h },
                endPoint: { l: endPoint.l, c: isNeutral ? neutralChroma : this.sourceColor.lch.c, h: this.sourceColor.lch.h },
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
        } catch (error) {
            console.error('Error generating scale:', error);
        }
    }

    calculateContrastInfo() {
        if (!this.colors || this.colors.length === 0) {
            console.log('No colors available for contrast calculation');
            return;
        }
    
        const lightestColor = this.colors[this.colors.length - 1];  // Assume the last color is the lightest
    
        // Step 1: Calculate contrast ratios
        this.contrastRatios = this.colors.map(color => color.contrast(lightestColor, "WCAG21"));
        
    
        // Step 2: Reset contrast markers
        this.contrastMarkers = new Array(this.colors.length).fill('');
    
        // Step 3: Find indices for each level
        const aaaIndex = this.contrastRatios.findLastIndex(ratio => ratio >= 7);
        const aaIndex = this.contrastRatios.findLastIndex(ratio => ratio >= 4.5);
        const aa18Index = this.contrastRatios.findLastIndex(ratio => ratio >= 3);
    
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
        console.log("Primary Color for TertiaryRow:", this.primaryColor);
console.log("Secondary Color for TertiaryRow:", this.secondaryColor);
console.log("Tertiary Color Generation Config:", this.config);
        
    };
    
    updateSwatches() {
        if (!this.containerId || !this.colors) {
            console.error(`Cannot update swatches: containerId or colors are missing`, this);
            return;
        }
    
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Container not found for marking swatches:', this.containerId);
            return;
        }
    
        container.innerHTML = ''; // Clear existing swatches
    
        this.colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.to('srgb').toString({ format: 'hex' });
            swatch.setAttribute('tabindex', '0');
            swatch.setAttribute('role', 'button');
            swatch.setAttribute('aria-label', `Copy color ${color.to('srgb').toString({ format: 'hex' })}`);
            
            // Add hexadecimal value as text
            const hexValueContainer = document.createElement('div');
            hexValueContainer.className = 'hex-value-container';
            
            const contrastRatio = document.createElement('span');
            contrastRatio.className = 'contrast-ratio';
            contrastRatio.textContent = this.contrastRatios[index].toFixed(2);
            // Set text color based on background lightness
            const lightness = color.lch.l;
            contrastRatio.style.color = lightness > 50 ? 'black' : 'white';
            hexValueContainer.appendChild(contrastRatio);
    
            const hexValue = document.createElement('span');
            hexValue.className = 'hex-value';
            hexValue.textContent = color.to('srgb').toString({ format: 'hex' });
            // Set text color based on background lightness
            hexValue.style.color = lightness > 50 ? 'black' : 'white';
            hexValueContainer.appendChild(hexValue);
    
            swatch.appendChild(hexValueContainer);
    
            // Add contrast markers
            if (this.contrastMarkers[index]) {
                const contrastMarkerContainer = document.createElement('div');
                contrastMarkerContainer.className = 'swatch__MarkerContainer';
                const contrastMarker = document.createElement('span');
                contrastMarker.className = 'swatch__Marker';
                contrastMarker.textContent = this.contrastMarkers[index];
                contrastMarker.setAttribute('data-level', this.contrastMarkers[index]);
                contrastMarker.style.color = lightness > 50 ? 'black' : 'white';
                contrastMarkerContainer.appendChild(contrastMarker);
                swatch.appendChild(contrastMarkerContainer);
            }
    
            // Add hover-click interactions with embedded SVGs
            const copyIcon = uiManager.createCopyIcon();
            copyIcon.style.color = lightness > 50 ? 'black' : 'white';
            swatch.appendChild(copyIcon);
    
            const checkIcon = uiManager.createCheckIcon();
            checkIcon.style.color = lightness > 50 ? 'black' : 'white';
            checkIcon.style.position = 'absolute';
            checkIcon.style.top = '50%';
            checkIcon.style.left = '50%';
            checkIcon.style.transform = 'translate(-50%, -50%)';
            swatch.appendChild(checkIcon);
    
            swatch.addEventListener('mouseover', () => {
                copyIcon.style.display = 'block';
            });
            swatch.addEventListener('mouseout', () => {
                copyIcon.style.display = 'none';
            });
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(color.to('srgb').toString({ format: 'hex' }));
                copyIcon.style.display = 'none';
                checkIcon.style.display = 'block';
                setTimeout(() => {
                    checkIcon.style.display = 'none';
                }, 1500);
            });
    
            // Add color ticker functionality
            uiManager.addColorTickerFunctionality(swatch);
    
            container.appendChild(swatch);
        });
    
        // Apply 'scale-swatch-container' class only to ScalesRow
        if (this instanceof ScalesRow) {
            container.classList.add('scale-swatch-container');
        } else {
            container.classList.remove('scale-swatch-container');
        }
    
        console.log('Updated swatches:', this.colors);
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
            console.log(`Chroma toggle changed: ${this.config.neutralChroma}`);
            this.generateScale();
            this.calculateContrastInfo();
            this.updateSwatches();
        });
    
        return toggleContainer;
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

        this.sourceColor = sourceColor; // Ensure sourceColor is set
        this.containerId = config.containerId || null; // Ensure containerId is set

        if (!this.containerId) {
            console.error('containerId is not set in ScalesRow constructor');
        }

        this.colors = this.generateColors(); // Ensure this method initializes colors

        if (!this.colors || this.colors.length === 0) {
            console.error('colors array is not initialized in ScalesRow constructor');
        }
        if (!this.sourceColor) {
            console.error('sourceColor is not set in ScalesRow constructor');
        }
    }

    generateColors() {
        const { steps, interpolation, lightnessEase, chromaEase, huePath } = this.config;

        if (!this.sourceColor || !this.sourceColor.lch) {
            console.error('BaseColorRow: sourceColor is invalid for color generation');
            return [];
        }

        // Example linear interpolation logic for colors
        return new Array(steps).fill(null).map((_, i) => {
            const t = i / (steps - 1);
            // Implement the interpolation logic here
            return this.sourceColor; // Replace with actual color interpolation logic
        });
    }

   

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
        
        try {
            console.log(`Generating scale with chroma: ${isNeutral ? neutralChroma : this.sourceColor.lch.c}`);
            this.scale = colorUtils.generateColorScale(this.sourceColor, {
                steps,
                startPoint: { l: startPoint.l, c: isNeutral ? neutralChroma : this.sourceColor.lch.c, h: this.sourceColor.lch.h },
                endPoint: { l: endPoint.l, c: isNeutral ? neutralChroma : this.sourceColor.lch.c, h: this.sourceColor.lch.h },
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
        } catch (error) {
            console.error('Error generating scale:', error);
        }
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
    constructor(primaryColor, secondaryColor, config = {}) {
        super({
            steps: 10,
            interpolation: 'linear',
            lightnessEase: 'linear',
            chromaEase: 'linear',
            huePath: 'shorter',
            ...config
        });

        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;

        if (!this.primaryColor || !this.primaryColor.lch) {
            console.error('primaryColor is not set or invalid in TertiaryRow constructor');
        }
        if (!this.secondaryColor || !this.secondaryColor.lch) {
            console.error('secondaryColor is not set or invalid in TertiaryRow constructor');
        }

        this.colors = this.generateColors(); // Ensure this method initializes colors

        if (!this.colors || this.colors.length === 0) {
            console.error('colors array is not initialized in TertiaryRow constructor');
        }
    }

    generateColors() {
        const { steps, interpolation, lightnessEase, chromaEase, huePath } = this.config;

        if (!this.primaryColor || !this.primaryColor.lch || !this.secondaryColor || !this.secondaryColor.lch) {
            console.error('TertiaryRow: primaryColor or secondaryColor is invalid for color generation');
            return [];
        }

        // Example linear interpolation logic for colors
        return new Array(steps).fill(null).map((_, i) => {
            const t = i / (steps - 1);
            // Implement the interpolation logic here
            return this.primaryColor; // Replace with actual color interpolation logic
        });
    }

    updateSwatches() {
        if (!this.containerId || !this.colors) {
            console.error(`Cannot update swatches: containerId or colors are missing`, this);
            return;
        }

        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Container not found for marking swatches:', this.containerId);
            return;
        }

        container.innerHTML = ''; // Clear existing swatches

        this.colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.to('srgb').toString({ format: 'hex' });
            swatch.setAttribute('tabindex', '0');
            swatch.setAttribute('role', 'button');
            swatch.setAttribute('aria-label', `Copy color ${color.to('srgb').toString({ format: 'hex' })}`);
            
            // Add contrast-ratio number
            const contrastRatio = document.createElement('span');
            contrastRatio.className = 'contrast-ratio';
            contrastRatio.textContent = this.contrastRatios[index].toFixed(2);
            swatch.appendChild(contrastRatio);

            // Add hexadecimal value as text
            const hexValue = document.createElement('span');
            hexValue.className = 'hex-value';
            hexValue.textContent = color.to('srgb').toString({ format: 'hex' });
            // Set text color based on background lightness
            const lightness = color.lch.l;
            hexValue.style.color = lightness > 50 ? 'black' : 'white';
            swatch.appendChild(hexValue);

            // Add padding and values location
            swatch.style.padding = '10px';
            hexValue.style.position = 'absolute';
            hexValue.style.bottom = '10px';
            hexValue.style.left = '10px';

            // Add mouse interaction
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(color.to('srgb').toString({ format: 'hex' }));
                alert(`Copied ${color.to('srgb').toString({ format: 'hex' })} to clipboard`);
            });

            container.appendChild(swatch);
        });

        console.log('Updated swatches:', this.colors);
    }

    update(primaryColor, secondaryColor) {
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;

        if (!this.primaryColor || !this.primaryColor.lch) {
            console.error('primaryColor is not set or invalid in TertiaryRow.update');
            return;
        }
        if (!this.secondaryColor || !this.secondaryColor.lch) {
            console.error('secondaryColor is not set or invalid in TertiaryRow.update');
            return;
        }

        console.log('Updating TertiaryRow with:', { primaryColor, secondaryColor });

        this.generateColors();
        this.updateSwatches();
    }

    /**
     * Creates a swatches container for the row.
     */
    createSwatches(containerIdPrefix = 'tertiary-row', label = '') {
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

        // Create swatches container
        const container = document.createElement('div');
        container.id = this.containerId;
        container.classList.add('color-swatch-container', 'tertiary-swatch-container');

        // Generate and update swatches
        this.updateSwatches();
    }

    /**
     * Static method to create a TertiaryRow instance.
     */
    static create(primaryColor, secondaryColor, config = {}, label = 'Tertiary Row') {
        if (!primaryColor || !secondaryColor) {
            console.warn('TertiaryRow.create: primaryColor or secondaryColor is undefined or null');
            return null;
        }

        const row = new TertiaryRow(primaryColor, secondaryColor, config);
        row.createSwatches('tertiaryrow', label);
        return row;
    }
}

