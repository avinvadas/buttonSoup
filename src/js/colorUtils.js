/* 
Color operation functions for use across the app
 */

import Color from 'colorjs.io';

// Export Color for use in other modules
export { Color };

// Convert LCH to Hex
export function lchToHex(l, c, h) {
    const color = new Color('lch', [l, c, h]);
    return color.to('srgb').toString({format: 'hex'});
}

// Set complementary hue relative to a source on spectrum diameter
export function setHue(originalHue, difference, bias = 0) {
    const maxBias = 5; // Maximum bias in degrees
    const biasedDifference = difference + (bias * maxBias);
    return (originalHue + biasedDifference + 360) % 360;
}

// Sets Chroma or Lightness value
export function setValue(value, factor) {
    return Math.max(0, Math.min(value * factor, value < 100 ? 100 : 132));
}

// Set one color relative to a source color (LCH format)
export function relateColor(srcColor, l, c, h) {
    try {
        const result = new Color('lch', [l, c, h]);
        return result;
    } catch (error) {
        return srcColor; // Return the source color if conversion fails
    }
}

// Generate color scale set (for color palettes)
export function generateColorScale(sourceColor, config) {
    const { steps, startPoint, endPoint, interpolation, includeSource, isNeutral, neutralChroma, lightnessEase, chromaEase, huePath } = config;
    const scaleArray = [];

    for (let i = 0; i < steps; i++) {
        let t = i / (steps - 1);
        
        let l = interpolate(startPoint.l, endPoint.l, t, lightnessEase || interpolation);
        let c, h;

        if (isNeutral) {
            // For neutral palette, use neutralChroma (which can be 0 or the small value set by the user)
            c = neutralChroma;
            h = sourceColor.lch.h; // Keep the hue constant for neutral palette
        } else {
            if (chromaEase === 'constant') {
                c = sourceColor.lch.c;
            } else {
                c = interpolate(startPoint.c, endPoint.c, t, chromaEase || interpolation);
            }

            if (huePath === 'constant') {
                h = sourceColor.lch.h;
            } else if (huePath === 'shorter') {
                h = interpolateHue(startPoint.h, endPoint.h, t, interpolation);
            } else {
                h = interpolate(startPoint.h, endPoint.h + (endPoint.h < startPoint.h ? 360 : 0), t, interpolation) % 360;
            }
        }

        let interpolatedColor = new Color("lch", [l, c, h]);
        scaleArray.push(mapToGamut(interpolatedColor));
    }

    if (includeSource && !isNeutral) {
        const sourceIndex = Math.round((steps - 1) * (sourceColor.lch.l - startPoint.l) / (endPoint.l - startPoint.l));
        scaleArray[sourceIndex] = sourceColor;
    }

    return scaleArray;
}

// Convert RGB to hex
export function rgbToHex(rgb) {
    const [r, g, b] = rgb.substring(4, rgb.length-1).split(',').map(x => parseInt(x));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Calculate source index
function calculateSourceIndex(sourceL, startL, endL, steps) {
    const normalizedPosition = (sourceL - startL) / (endL - startL);
    return Math.round(normalizedPosition * (steps - 1));
}

// Calculate interpolation points
function calculateInterpolationPoints(currentStep, sourceIndex, totalSteps, startPoint, endPoint, sourceLch) {
    if (currentStep < sourceIndex) {
        return {
            startLch: startPoint,
            endLch: sourceLch,
            t: currentStep / sourceIndex
        };
    } else {
        return {
            startLch: sourceLch,
            endLch: endPoint,
            t: (currentStep - sourceIndex) / (totalSteps - 1 - sourceIndex)
        };
    }
}

// Interpolate color
function interpolateColor(start, end, t, method) {
    const interpolate = (a, b) => a + (b - a) * t;
    let l, c, h;

    switch (method) {
        case 'linear':
            l = interpolate(start.l, end.l);
            c = interpolate(start.c, end.c);
            h = interpolateHue(start.h, end.h, t);
            break;
        case 'quadratic':
            l = interpolate(start.l, end.l, t * t);
            c = interpolate(start.c, end.c, t * t);
            h = interpolateHue(start.h, end.h, t * t);
            break;
        default:
            throw new Error(`Unsupported interpolation method: ${method}`);
    }

    return new Color("lch", [l, c, h]);
}

// Interpolate hue values
export function interpolateHue(start, end, t, method = 'linear') {
    let diff = end - start;
    if (Math.abs(diff) > 179.5) {
        diff = diff > 0 ? diff - 360 : diff + 360;
    }
    let h = interpolate(start, start + diff, t, method) % 360;
    h = h < 0 ? h + 360 : h;
    return h;
}

export function interpolateHueLonger(start, end, t, method = 'linear') {
    let diff = end - start;
    if (Math.abs(diff) < 179.5) {
        diff = diff > 0 ? diff - 360 : diff + 360;
    }
    let h = interpolate(start, start + diff, t, method) % 360;
    h = h < 0 ? h + 360 : h;
    return h;
}

// General interpolation methods
function elastic(t, amplitude = 1, period = 0.3) {
    const s = period / (2 * Math.PI) * Math.asin(1 / amplitude);
    return amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / period) + 1;
}

function elasticIn(t, amplitude = 1, period = 0.3) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const s = period / (2 * Math.PI) * Math.asin(1 / amplitude);
    return -(amplitude * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - s) * (2 * Math.PI) / period));
}

function elasticOut(t, amplitude = 1, period = 0.3) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return elastic(t, amplitude, period);
}

function sineWave(t) {
    return (Math.sin(2 * Math.PI * t - Math.PI / 2) + 1) / 2;
}

function cosineWave(t) {
    return (Math.cos(2 * Math.PI * t) + 1) / 2;
}

// Interpolate functions by methods:
export function interpolate(start, end, t, method = 'linear', options = {}) {
    const { amplitude = 1, period = 0.3 } = options;
    const isReverse = method.startsWith('reverse');
    const baseMethod = isReverse ? method.slice(7) : method;
    
    if (isReverse) {
        t = 1 - t;
    }

    let result;
    switch (baseMethod) {
        case 'linear':
            result = start + (end - start) * t;
            break;
        case 'quadratic':
            result = start + (end - start) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
            break;
        case 'cubic':
            result = start + (end - start) * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
            break;
        case 'easeInOut':
            result = start + (end - start) * (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
            break;
        case 'easeInOutBack':
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            result = start + (end - start) * (t < 0.5
                ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2);
            break;
        case 'elasticIn':
            result = start + (end - start) * elasticIn(t, amplitude, period);
            break;
        case 'elasticOut':
            result = start + (end - start) * elasticOut(t, amplitude, period);
            break;
        case 'sineWave':
            result = start + (end - start) * sineWave(t);
            break;
        case 'cosineWave':
            result = start + (end - start) * cosineWave(t);
            break;
        default:
            throw new Error(`Unsupported interpolation method: ${method}`);
    }

    return isReverse ? end + (start - end) * (1 - t) : result;
}
// Check text-bg contrast
export function getContrastTextColor(backgroundColor) {
    const color = new Color(backgroundColor);
    const luminance = color.luminance;
    return luminance > 0.179 ? '#000000' : '#ffffff';
}

// Calculate chroma based on hue difference
export function calculateChroma(primaryChroma, hueDifference) {
    const factor = 1 - (hueDifference / 360);
    return primaryChroma * factor;
}

// Update contrast status
export function updateContrastStatus(color1Hex, color2Hex) {
    const color1 = new Color(color1Hex);
    const color2 = new Color(color2Hex);
    const contrastRatio = color1.contrast(color2, "WCAG21");
    return {
        ratio: contrastRatio.toFixed(2),
        aa: contrastRatio >= 4.5,
        aaa: contrastRatio >= 7,
        aaLarge: contrastRatio >= 3
    };
}

// Generate random LCH color
export function generateRandomLCH() {
    return new Color('lch', [
        50,  // L: 0-100
        80,  // C: 0-132 (approximate max for sRGB)
        Math.random() * 360   // H: 0-360
    ]);
}

export function mapToGamut(color) {
    const srgb = color.to('srgb');
    
    // Check if the color is already in gamut
    if (isInSRGBGamut(srgb)) {
        return srgb;
    }

    let lch = color.to('lch');
    let lower = 0;
    let upper = lch.c;
    let mid;

    // Binary search for the highest in-gamut chroma
    while (upper - lower > 0.1) {
        mid = (lower + upper) / 2;
        const testColor = new Color('lch', [lch.l, mid, lch.h]);
        if (isInSRGBGamut(testColor.to('srgb'))) {
            lower = mid;
        } else {
            upper = mid;
        }
    }

    // Create the new color with the highest possible chroma
    return new Color('lch', [lch.l, lower, lch.h]).to('srgb');
}

function isInSRGBGamut(srgb) {
    const [r, g, b] = srgb.coords;
    return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1;
}

// Add a new function to preserve chroma as much as possible
export function preserveChroma(color) {
    const original = color.to('lch');
    const mapped = mapToGamut(color);
    const mappedLCH = mapped.to('lch');

    // If the mapped color has significantly less chroma, try to preserve it
    if (mappedLCH.c < original.c * 0.9) {
        // Try to preserve chroma by adjusting lightness
        for (let l = original.l; l >= 0 && l <= 100; l += (l < original.l ? -1 : 1)) {
            const adjusted = new Color('lch', [l, original.c, original.h]);
            if (isInSRGBGamut(adjusted.to('srgb'))) {
                return adjusted.to('srgb');
            }
        }
    }

    return mapped;
}