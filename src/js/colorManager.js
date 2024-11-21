/*
Holding the values of currently selected Primary and Secondary colors,
Observe and notify their hanges.
*/
import ObserverManager from './observerManager.js';
import { Color } from './colorUtils.js';

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
            this.updateSecondaryColor(); // Recalculate secondary color
            this.updateTertiaryColor(); // Recalculate tertiary color based on updated secondary
            this.notify(); // Notify observers
        } else {
            console.error('Invalid primary color:', color);
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

            // Example: Calculate tertiary as midpoint
            const tertiaryHue = (primaryHue + secondaryHue + 180) % 360;
            const tertiaryL = (this.primaryColor.lch.l + this.secondaryColor.lch.l) / 2;
            const tertiaryC = (this.primaryColor.lch.c + this.secondaryColor.lch.c) / 2;

            this.tertiaryColor = new Color('lch', [tertiaryL, tertiaryC, tertiaryHue]);
        } else {
            console.warn('Cannot calculate tertiaryColor without primaryColor and secondaryColor.');
        }
    }

    setSecondaryColor(color) {
        if (color && color instanceof Color) {
            this.secondaryColor = color;
            this.updateTertiaryColor(); // Cascade to tertiary color
            this.notify(); // Notify observers
        } else {
            console.error('Invalid secondary color:', color);
        }
    }

    notify() {
        const data = {
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            tertiaryColor: this.tertiaryColor,
        };

        console.log('Notifying observers with:', data);

        this.observerManager.notifyObservers(data);
    }

    addObserver(observer) {
        this.observerManager.addObserver(observer);
    }

    removeObserver(observer) {
        this.observerManager.removeObserver(observer);
    }
}
