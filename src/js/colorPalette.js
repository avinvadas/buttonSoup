import * as colorUtils from './colorUtils.js';
import { createColorSwatches } from './uiManager.js';

/* ScaleRow object | Generating a scale-based palette: */
export function ScalesRow(sourceColor, config = {}) {
    console.log('ScalesRow constructor called with:', sourceColor, config);
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

    this.generateScale();
}

/* Generate the scales */
ScalesRow.prototype.generateScale = function() {
    const { steps, startPoint, endPoint, interpolation, includeSource, isNeutral, neutralChroma } = this.config;
    console.log('Generating scale with:', { steps, startPoint, endPoint, interpolation, includeSource, isNeutral, neutralChroma });
    console.log('Source color:', this.sourceColor);
    
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
    
    console.log('Generated scale:', this.scale);
    
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
ScalesRow.prototype.update = function(primaryColor, secondaryColor) {
    const newSourceColor = this.isPrimaryBased ? primaryColor : secondaryColor;
    const shouldUpdate = !this.sourceColor.equals(newSourceColor);
    if (shouldUpdate) {
        this.sourceColor = newSourceColor;
        this.config.startPoint.h = this.sourceColor.lch.h;
        this.config.endPoint.h = this.sourceColor.lch.h;
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
    toggleContainer.className = 'neutral-chroma-toggle toggle-comp';
    toggleContainer.innerHTML = `
        <span id="chroma-toggle-label">Add chroma: </span>
        <label class="switch">
            <input type="checkbox" id="chroma-toggle-checkbox" 
                   class="toggle-checkbox"
                   role="switch"
                   aria-checked="${this.config.neutralChroma > 0}"
                   aria-labelledby="chroma-toggle-label"
                   tabindex="0"
                   ${this.config.neutralChroma > 0 ? 'checked' : ''}>
            <span class="slider round"></span>
        </label>
    `;

    const checkbox = toggleContainer.querySelector('input');
    checkbox.addEventListener('change', () => {
        this.config.neutralChroma = checkbox.checked ? 5 : 0;
        this.config.isNeutral = true;
        checkbox.setAttribute('aria-checked', checkbox.checked);
        this.generateScale();
        this.updateSwatches();
    });

    checkbox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            checkbox.click();
        }
    });

    return toggleContainer;
};
/* Create the container & Swatches */
ScalesRow.prototype.createSwatches = function(containerIdPrefix = 'color-scale', label = '') {
    this.containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
    const palettesSection = document.querySelector('.palettes-section');
    if (!palettesSection) {
        console.error('Palettes section not found');
        return;
    }

    // Create and append the label
    if (label) {
        const labelElement = document.createElement('h4');
        labelElement.textContent = label;
        labelElement.classList.add('heading-04', 'palette-label');
        palettesSection.appendChild(labelElement);
    }

    // Create and append the container
    const container = document.createElement('div');
    container.id = this.containerId;
    container.classList.add('color-swatch-container', 'scale-swatch-container');

    // Add chroma toggle for neutral palette
    if (this.config.isNeutral) {
        const chromaToggle = this.createChromaToggle();
        palettesSection.appendChild(chromaToggle);
    }
    palettesSection.appendChild(container);
    this.updateSwatches();
};

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
            console.log(`Marked swatch ${index}`);
        }
    });
};

/* Create palette by source color and configurations */
ScalesRow.create = function(sourceColor, config = {}) {
    console.log('ScalesRow.create called with:', sourceColor ? sourceColor.toString() : 'undefined sourceColor', JSON.stringify(config));
    
    if (!sourceColor) {
        console.warn('ScalesRow.create: sourceColor is undefined or null');
        sourceColor = new colorUtils.Color('lch', [50, 1, 0]); // Default color with non-zero chroma
    }

    // Ensure non-zero chroma
    if (sourceColor.lch.c === 0) {
        console.warn('Source color has zero chroma, adjusting');
        sourceColor = new colorUtils.Color('lch', [sourceColor.lch.l, 1, sourceColor.lch.h]);
    }

    const row = new ScalesRow(sourceColor, config);
    
    console.log('ScalesRow created:', row.sourceColor.toString(), JSON.stringify(row.config));

    return row;
};



/* HarmonicColorRow object | Generating a hue- spreaded palette: */
export function HarmonicColorRow(primaryColor, secondaryColor, config = {}) {
    console.log('🎨 HarmonicColorRow constructor called 🎨');
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
    console.log('Generating colors with config:', JSON.stringify(this.config, null, 2));

    this.colors = new Array(steps);

    console.log(`Primary color: ${this.primaryColor.toString()}`);
    console.log(`Secondary color: ${this.secondaryColor.toString()}`);
    console.log(`Hue path: ${huePath}`);

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

            this.colors[i] = toHex(new colorUtils.Color("lch", [l, c, h]));
        }

        // Ensure primary and secondary colors are included
        const primaryIndex = 0;
        const secondaryIndex = Math.round((hueDiff / 360) * steps) % steps;
        this.colors[primaryIndex] = toHex(this.primaryColor);
        this.colors[secondaryIndex] = toHex(this.secondaryColor);
    } else {
        // Shorter and longer path logic
        let shorterPath, longerPath;
        if (hueDiff <= 180) {
            shorterPath = hueDiff;
            longerPath = hueDiff - 360;
        } else {
            shorterPath = hueDiff - 360;
            longerPath = hueDiff;
        }

        let selectedPath = huePath === 'shorter' ? shorterPath : longerPath;

        this.colors[0] = toHex(this.primaryColor);
        this.colors[steps - 1] = toHex(this.secondaryColor);

        for (let i = 1; i < steps - 1; i++) {
            let t = i / (steps - 1);
            let h = (hue1 + selectedPath * t + 360) % 360;
            let l = colorUtils.interpolate(this.primaryColor.lch.l, this.secondaryColor.lch.l, t, lightnessEase);
            let c = colorUtils.interpolate(this.primaryColor.lch.c, this.secondaryColor.lch.c, t, chromaEase);

            this.colors[i] = toHex(new colorUtils.Color("lch", [l, c, h]));
        }
    }

    console.log('Final generated colors:', this.colors);
};


HarmonicColorRow.prototype.update = function(primaryColor, secondaryColor) {
    console.log('Updating HarmonicColorRow');
    console.log('Before update - Primary:', this.primaryColor.toString(), 'Secondary:', this.secondaryColor.toString());
    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;
    console.log('After update - Primary:', this.primaryColor.toString(), 'Secondary:', this.secondaryColor.toString());
    this.generateColors();
    
    if (this.containerId) {
        console.log('Updating swatches for container:', this.containerId);
        this.updateSwatches();
    } else {
        console.warn('Container ID not set for HarmonicColorRow. Swatches not updated.');
    }
};

HarmonicColorRow.prototype.updateSwatches = function() {
    if (this.containerId && this.colors) {
        console.log(`Updating swatches for ${this.containerId} with colors:`, this.colors);
        createColorSwatches(this.colors, this.containerId, this.contrastRatios);
       // this.markPrimarySecondaryColors();
    } else {
        console.error(`Cannot update swatches: containerId or colors is missing`, this);
    }
};

HarmonicColorRow.prototype.createSwatches = function(containerIdPrefix = 'harmonic-color-row', label = '') {
    this.containerId = `${containerIdPrefix}-${Math.random().toString(36).substr(2, 9)}`;
    const palettesSection = document.querySelector('.palettes-section');
    if (!palettesSection) {
        console.error('Palettes section not found');
        return;
    }

    // Create and append the label
    if (label) {
        const labelElement = document.createElement('h4');
        labelElement.textContent = label;
        labelElement.classList.add('heading-04', 'palette-label');
        palettesSection.appendChild(labelElement);
    }

    // Create and append the container
    const container = document.createElement('div');
    container.id = this.containerId;
    container.classList.add('color-swatch-container', 'accent-swatch-container');
    palettesSection.appendChild(container);
    
    console.log(`Created container with ID: ${this.containerId}`);
    this.updateSwatches();
};

HarmonicColorRow.prototype.markPrimarySecondaryColors = function() {
    console.log('Marking colors for HarmonicColorRow');
    const container = document.getElementById(this.containerId);
    if (!container) {
        console.error('Container not found:', this.containerId);
        return;
    }

    const swatches = container.querySelectorAll('.color-swatch');
    console.log('Number of swatches found:', swatches.length);

    const primaryHex = this.primaryColor.to('srgb').toString({format: "hex"});
    const secondaryHex = this.secondaryColor.to('srgb').toString({format: "hex"});
    console.log('Primary color (hex):', primaryHex);
    console.log('Secondary color (hex):', secondaryHex);

    swatches.forEach((swatch, index) => {
        swatch.classList.remove('swatch-marked');
        
        const currentColor = this.colors[index];
        console.log(`Swatch ${index} color:`, currentColor);

        if (currentColor === primaryHex || currentColor === secondaryHex) {
            swatch.classList.add('swatch-marked');
            console.log(`Marked swatch ${index}`);
        }
    });
};

HarmonicColorRow.create = function(primaryColor, secondaryColor, config = {}) {
    console.log('🎨 CREATING HarmonicColorRow 🎨');
    console.log('Config:', JSON.stringify(config, null, 2));
    console.log('Primary Color:', primaryColor.toString());
    console.log('Secondary Color:', secondaryColor.toString());
    const row = new HarmonicColorRow(primaryColor, secondaryColor, config);
    return row;
};