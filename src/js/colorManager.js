/*
Holding the values of currently selected Primary and Secondary colors,
Observe and notify their hanges.
*/
import ObserverManager from './observerManager.js';
import { Color } from './colorUtils.js';
let debounceTimer;
export default class ColorManager {
    constructor() {
        this.primaryColor = null;
        this.secondaryColor = null;
        this.tertiaryColor = null;
        this.observerManager = new ObserverManager(); // Centralized observer management
    }

    setPrimaryColor(color) {
        if (color && color instanceof Color) {
            this.primaryColor = color;
    
            // Update secondary and tertiary colors before notifying
            this.updateSecondaryColor();
            this.updateTertiaryColor();
    
            // Notify only after all updates
            this.notify();
        } else {
            console.error('Invalid primary color:', color);
        }
    }
    

    setSecondaryColor(color) {
        if (color && color instanceof Color) {
            const lch = color.to('lch');
            this.secondaryColor = new Color('lch', [lch.l, Math.max(lch.c, 1), lch.h]);
    
            // Update tertiary color before notifying
            this.updateTertiaryColor();
    
            // Notify only after all updates
            this.notify();
        } else {
            console.error('Invalid secondary color:', color);
        }
    }
    

    updateSecondaryColor() {
        if (this.primaryColor) {
            // Example: Derive secondary color from primary
            const primaryHue = this.primaryColor.lch.h;
            const secondaryHue = (primaryHue + 120) % 360; // Example logic

            const l = this.primaryColor.lch.l;
            const c = this.primaryColor.lch.c;

            this.secondaryColor = new Color('lch', [l, c, secondaryHue]);
            this.updateTertiaryColor(); // Cascade to tertiary color
        } else {
            console.warn('Cannot calculate secondaryColor without primaryColor.');
        }
    }

    updateTertiaryColor() {
        if (this.primaryColor && this.secondaryColor) {
            const primaryHue = this.primaryColor.lch.h;
            const secondaryHue = this.secondaryColor.lch.h;
    
            let tertiaryHue = (primaryHue - (secondaryHue - primaryHue) + 360) % 360;
            if (Math.abs(secondaryHue - primaryHue) > 175) {
                tertiaryHue = (primaryHue + (secondaryHue - primaryHue) / 2 + 360) % 360;
            }
    
            const tertiaryL = (this.primaryColor.lch.l + this.secondaryColor.lch.l) / 2;
            const tertiaryC = Math.max(this.primaryColor.lch.c, this.secondaryColor.lch.c);
    
            this.tertiaryColor = new Color('lch', [tertiaryL, tertiaryC, tertiaryHue]);

            console.log("Generated tertiaryColor:", this.tertiaryColor);

        } else {
            console.warn("Skipping tertiaryColor update: primaryColor or secondaryColor is not set.");
        }
    }
    
    notify() {
        const data = {
            primaryColor: this.primaryColor || new Color('lch', [50, 50, 0]),
            secondaryColor: this.secondaryColor || new Color('lch', [60, 40, 0]),
            tertiaryColor: this.tertiaryColor || new Color('lch', [70, 30, 180]),
        };
    
        // Skip notification if tertiary color is invalid
        if (data.tertiaryColor.lch.c === 0) {
            console.warn('Skipping notification: Tertiary color chroma is zero');
            return;
        }
    
        console.log('Notifying observers with validated data:', data);
        this.observerManager.notifyObservers(data);
    }
    


    
    

    addObserver(observer) {
        this.observerManager.addObserver(observer);
    }

    removeObserver(observer) {
        this.observerManager.removeObserver(observer);
    }
}
