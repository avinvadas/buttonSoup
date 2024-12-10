/*
Holding the values of currently selected Primary and Secondary colors,
Observe and notify their hanges.
*/
import ObserverManager from './observerManager.js';
import { Color, isValidColor } from './colorUtils.js';
export default class ColorManager {
    constructor() {
        this.primaryColor = null;
        this.secondaryColor = null;
        this.tertiaryColor = null;
        this.observerManager = new ObserverManager(); // Centralized observer management
    }

    notifyObservers(type, data) {
        this.observerManager.notifyObservers({ [type]: data });
    }

    addObserver(observer) {
        this.observerManager.addObserver(observer);
    }

    removeObserver(observer) {
        this.observerManager.removeObserver(observer);
    }

    setPrimaryColor(color) {
        
        if (color && color instanceof Color) {
            console.log('Setting primary color:', color);
            this.primaryColor = color;
            console.log("Primary color set for TertiaryRow:", this.primaryColor);
    
            // Notify observers
            this.notify();
    
            // Ensure secondary color update completes before tertiary color update
            if (this.secondaryColor) {
                this.updateTertiaryColor();
            } else {
                console.warn("Secondary color is not ready when updating tertiary color.");
            }
        } else {
            console.error("Invalid primary color:", color);
        }
    }
    
    setSecondaryColor(color) {
        if (color && color instanceof Color) {
            console.log('Setting secondary color:', color);
            const lch = color.to('lch');
            this.secondaryColor = new Color('lch', [lch.l, Math.max(lch.c, 1), lch.h]);
            console.log("Secondary color set for TertiaryRow:", this.secondaryColor);
    
            // Notify observers
            this.notify();
    
            // Trigger tertiary color update only when both primary and secondary colors are ready
            if (this.primaryColor) {
                this.updateTertiaryColor();
            } else {
                console.warn("Primary color is not ready when updating tertiary color.");
            }
        } else {
            console.error("Invalid secondary color:", color);
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
            console.log("Updating tertiary color based on primary and secondary colors");
            try {
                // Existing logic for tertiary color calculation
                const primaryHue = this.primaryColor.lch.h;
                const secondaryHue = this.secondaryColor.lch.h;
                let tertiaryHue = (primaryHue - (secondaryHue - primaryHue) + 360) % 360;

                if (Math.abs(secondaryHue - primaryHue) > 175) {
                    tertiaryHue = (primaryHue + (secondaryHue - primaryHue) / 2 + 360) % 360;
                }

                const tertiaryL = (this.primaryColor.lch.l + this.secondaryColor.lch.l) / 2;
                const tertiaryC = Math.max(this.primaryColor.lch.c, this.secondaryColor.lch.c);
                console.log('Updating tertiary color based on primary and secondary colors');
                this.tertiaryColor = new Color('lch', [tertiaryL, tertiaryC, tertiaryHue]);
                console.log("Generated tertiaryColor:", this.tertiaryColor);
                
                // Ensure tertiary color is valid before proceeding
                if (!isValidColor(this.tertiaryColor)) {
                    console.error('Primary or secondary color is not set when updating tertiary color');
                    return;
                }

                // Update the --color-tertiary variable
                document.documentElement.style.setProperty('--color-tertiary', this.tertiaryColor.to('srgb').toString({ format: 'hex' }));

                // Notify observers about the color changes
                this.notifyObservers('tertiaryColor', this.tertiaryColor);

            } catch (error) {
                console.error("Error generating tertiaryColor:", error);
            }
        } else {
            console.warn("Cannot update tertiary color: primary or secondary color is missing");
        }
        
    }

    notify() {
        this.notifyObservers('primaryColor', this.primaryColor);
        this.notifyObservers('secondaryColor', this.secondaryColor);
        this.notifyObservers('tertiaryColor', this.tertiaryColor);
    }
}

const observer = {
    update(data) {
        const { primaryColor, secondaryColor, tertiaryColor } = data;
        console.log("Observer received update:", { primaryColor, secondaryColor, tertiaryColor });
        // Handle the update
    }
};
