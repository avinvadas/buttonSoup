import ObserverManager from './observerManager.js';
import { Color, isValidColor } from './colorUtils.js';

export default class ColorManager {
    constructor() {
        this.primaryColor = null;
        this.secondaryColor = null;
        this.tertiaryColor = null;
        this.quaternaryColor = null;
        this.observerManager = new ObserverManager();
    }

    setPrimaryColor(color, segCtrl) {
        if (color && color instanceof Color) {
            this.primaryColor = color;
            this.updateTertiaryColor(segCtrl);
            this.updateQuaternaryColor(segCtrl);
            this.notify();
        }
    }

    setSecondaryColor(color, segCtrl) {
        if (color && color instanceof Color) {
            this.secondaryColor = color;
            this.updateTertiaryColor(segCtrl);
            this.updateQuaternaryColor(segCtrl);
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
                    tertiaryHue = (primaryHue - 150 + 360) % 360;
                    break;
                case 'triad':
                    tertiaryHue = (primaryHue - 120 + 360) % 360;
                    break;
                case 'quad':
                    tertiaryHue = (primaryHue - 90 + 360) % 360;
                    break;
                case 'analogous':
                    tertiaryHue = (primaryHue - 45 + 360) % 360;
                    break;
                default:
                    tertiaryHue = (primaryHue - (secondaryHue - primaryHue) + 360) % 360;
            }

            const lightnessRatio = this.secondaryColor.lch.l / this.primaryColor.lch.l;
            const chromaRatio = this.secondaryColor.lch.c / this.primaryColor.lch.c;

            const tertiaryL = this.primaryColor.lch.l * lightnessRatio;
            const tertiaryC = this.primaryColor.lch.c * chromaRatio;
        
            this.tertiaryColor = new Color('lch', [tertiaryL, tertiaryC, tertiaryHue]);
            this.notify();
        }
    }

    updateQuaternaryColor(segCtrl) {
        if (this.primaryColor) {
            const primaryHue = this.primaryColor.lch.h;
            let quaternaryHue;

            switch (segCtrl) {
                case 'complementary':
                    quaternaryHue = (primaryHue + 150) % 360;
                    break;
                case 'triad':
                case 'quad':
                    quaternaryHue = (primaryHue + 180) % 360;
                    break;
                default:
                    quaternaryHue = (primaryHue + 150) % 360; // Default to complementary
            }

            // Use the same lightness and chroma as the primary color for simplicity
            const quaternaryL = this.primaryColor.lch.l;
            const quaternaryC = this.primaryColor.lch.c;
        
            this.quaternaryColor = new Color('lch', [quaternaryL, quaternaryC, quaternaryHue]);
            this.notify();
        }
    }

    notify() {
        this.observerManager.notifyObservers({
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            tertiaryColor: this.tertiaryColor,
            quaternaryColor: this.quaternaryColor
        });
    }


    addObserver(observer) {
        this.observerManager.addObserver(observer);
    }

    removeObserver(observer) {
        this.observerManager.removeObserver(observer);
    }
}

