import ObserverManager from './observerManager.js';
import { Color, isValidColor } from './colorUtils.js';

export default class ColorManager {
    constructor() {
        this.primaryColor = null;
        this.secondaryColor = null;
        this.tertiaryColor = null;
        this.observerManager = new ObserverManager();
    }

    setPrimaryColor(color, segCtrl) {
        if (color && color instanceof Color) {
            this.primaryColor = color;
            this.updateTertiaryColor(segCtrl);
            this.notify();
        }
    }

    setSecondaryColor(color, segCtrl) {
        if (color && color instanceof Color) {
            this.secondaryColor = color;
            this.updateTertiaryColor(segCtrl);
            this.notify();
        }
    }

    updateTertiaryColor(segCtrl) {
        if (this.primaryColor && this.secondaryColor) {
            const primaryHue = this.primaryColor.lch.h;
            const secondaryHue = this.secondaryColor.lch.h;
            let tertiaryHue;

            switch (segCtrl) {
                case 'complementary':
                    tertiaryHue = (primaryHue + 90) % 360;
                    break;
                case 'triad':
                    tertiaryHue = (primaryHue + 240) % 360;
                    break;
                case 'quad':
                    tertiaryHue = (primaryHue + 270) % 360;
                    break;
                case 'analogous':
                    tertiaryHue = (primaryHue + 315) % 360;
                    break;
                default:
                    // If no segCtrl is provided, use the original calculation
                    tertiaryHue = (primaryHue + secondaryHue) / 2;
            }

            const tertiaryL = (this.primaryColor.lch.l + this.secondaryColor.lch.l) / 2;
            const tertiaryC = Math.max(this.primaryColor.lch.c, this.secondaryColor.lch.c);
            
            this.tertiaryColor = new Color('lch', [tertiaryL, tertiaryC, tertiaryHue]);
            this.notify();
        }
    }

    notify() {
        this.observerManager.notifyObservers({
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            tertiaryColor: this.tertiaryColor
        });
    }

    addObserver(observer) {
        this.observerManager.addObserver(observer);
    }

    removeObserver(observer) {
        this.observerManager.removeObserver(observer);
    }
}

