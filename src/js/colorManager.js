import { Color } from './colorUtils.js';

export default class ColorManager {
    constructor() {
        this.primaryColor = null;
        this.secondaryColor = null;
        this.observers = []; 
    }

    setPrimaryColor(color) {
        if (color && color instanceof Color) {
            this.primaryColor = color;
            this.notifyObservers();
        } else {
            console.error("Invalid primary color:", color);
        }
    }
    setSecondaryColor(color) {
    console.log('ColorManager setSecondaryColor called with:', color.toString());
    if (color && color instanceof Color) {
        const lch = color.to('lch');
        console.log('LCH values before assignment:', lch.l, lch.c, lch.h);
        this.secondaryColor = new Color('lch', [lch.l, Math.max(lch.c, 1), lch.h]);
        console.log('ColorManager secondary color set to:', this.secondaryColor.toString());
        this.notifyObservers();
    } else {
        console.error("Invalid secondary color:", color);
    }
}
    
    addObserver(observer) {
        if (typeof observer.update === 'function') {
            this.observers.push(observer);
        } else {
            console.error('Invalid observer: update method is missing', observer);
        }
    }

/* The observer function notifies when primary or secondary color updates, so the rest of the color system can align */
notifyObservers() {
    console.log('Notifying observers');
    console.log('Primary color:', this.primaryColor ? this.primaryColor.toString() : 'undefined');
    console.log('Secondary color:', this.secondaryColor ? this.secondaryColor.toString() : 'undefined');
    
    if (this.primaryColor && this.secondaryColor) {
        this.observers.forEach((observer, index) => {
            if (typeof observer.update === 'function') {
                console.log(`Updating observer ${index} with:`, this.primaryColor.toString(), this.secondaryColor.toString());
                observer.update(this.primaryColor, this.secondaryColor);
            } else {
                console.error('Observer does not have an update method:', observer);
            }
        });
    } else {
        console.warn("Cannot notify observers: Invalid primary or secondary color");
    }
}
}