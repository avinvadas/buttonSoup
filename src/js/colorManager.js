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
            this.notifyObservers();
        } else {
            console.error("Invalid primary color:", color);
        }
    }
    setSecondaryColor(color) {
    if (color && color instanceof Color) {
        const lch = color.to('lch');
        this.secondaryColor = new Color('lch', [lch.l, Math.max(lch.c, 1), lch.h]);
        this.notifyObservers();
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

/* The observer function notifies when primary or secondary color updates, so the rest of the color system can align */
notifyObservers() {
    if (this.primaryColor && this.secondaryColor) {
        this.observers.forEach((observer, index) => {
            if (typeof observer.update === 'function') {
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