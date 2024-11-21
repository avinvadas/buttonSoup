export default class ObserverManager {
    constructor() {
        this.observers = [];
    }

    addObserver(observer) {
        if (typeof observer.update === 'function') {
            this.observers.push(observer);
        } else {
            console.error('Invalid observer: update method is missing');
        }
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    

    notifyObservers(data) {
        console.log('Notifying observers with data:', data);
        this.observers.forEach((observer) => {
            try {
                observer.update(data);
            } catch (error) {
                console.error('Error in observer update:', error, observer);
            }
        });
    }
}
