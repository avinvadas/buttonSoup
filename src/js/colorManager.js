/*
Holding the values of currently selected Primary and Secondary colors,
Observe and notify their hanges.
*/
import { Color } from './colorUtils.js';

export default class ColorManager {
    constructor() {
        this.primaryColor = null;
        this.secondaryColor = null;
        this.observers = []; 
    }

    /* Primary and Secondary color set functions */
    setPrimaryColor(color) {
        if (color && color instanceof Color) {
            this.primaryColor = color;
           /* console.log('Primary color set:', this.primaryColor);*/
            this.maybeNotifyObservers();
        } else {
            console.error("Invalid primary color:", color);
        }
    }

    setSecondaryColor(color) {
        if (color && color instanceof Color) {
            const lch = color.to('lch');
           /* console.log('Setting secondary color to LCH:', lch);  // Log the LCH values of the secondary color*/
            this.secondaryColor = new Color('lch', [lch.l, Math.max(lch.c, 1), lch.h]);
           /* console.log('Secondary color set as:', this.secondaryColor);*/
            this.maybeNotifyObservers();
        } else {
            console.error("Invalid secondary color:", color);
        }
    }

    /* Adding observers */   
    addObserver(observer) {
        if (typeof observer.update === 'function') {
            this.observers.push(observer);
        } else {
            console.error('Invalid observer: update method is missing', observer);
        }
    }

    /* Notify observers only if both primary and secondary are set */
    maybeNotifyObservers() {
        if (this.primaryColor && this.secondaryColor) {
            this.notifyObservers();
        } else {
        }
    }

    /* The observer function notifies when both primary and secondary color updates */
    notifyObservers() {
        this.observers.forEach((observer, index) => {
            if (typeof observer.update === 'function') {
                observer.update(this.primaryColor, this.secondaryColor);
            } else {
                console.error('Observer does not have an update method:', observer);
            }
        });
    }
}

