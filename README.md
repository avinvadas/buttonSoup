ButtonSoup is a lightweight tool for making color themes, created for personal use and opened publicly. It can be experimented on [https://buttonsoup.xyz](https://buttonsoup.xyz/)

The tool is based on the [Colorjs.io](https://colorjs.io/) library for its color calculations, and helps generating [adaptive color palettes](https://medium.com/thinking-design/introducing-adaptive-color-palettes-111b5842fc88) out of single hexadecimal value. 
Calculations are done in the [LCH color space](https://lea.verou.me/blog/2020/04/lch-colors-in-css-what-why-and-how/), to better align with the human vision as well as support a wider RGB gamut. 
As this app's current version is based on the wonderful works and writings of [Lea Verou](https://lea.verou.me/), [Chris Lilley](https://svgees.us/) and [Nate Baldwin](https://natebaldw.in/), All mistakes or miscalculations are solely my own.

### When to use it:

I often use it when I need to quickly experiment and "branch out" of an existing brand, design system or other binding color system, base an exploration around a given agreed color and merge back in. 
To generate a full-scale color system that a Design System can base on, I recommend tools such as [Leonardo.io](https://leonardocolor.io/)
### Technical

##### Dependencies:
- The project is currently built with [npm](https://www.npmjs.com/) . 
- All color calculations are supported by [Colorjs.io](https://colorjs.io/) library.
- Project is packaged with [Parce.jsl](https://parceljs.org/), but you can change to your own tool of choice through the `package.json` file.
##### To build locally:
- Clone the repository
- Go to `src/` library in your CLI and 
- Run `npm start`
##### Files included:

- `index.html`
- `index.js` 
- `style.css` 
- `colorManajer.js` : Holds primary and secondary color data, notify changes.
- `colorPalette.js` : Calculates palette steps and differentiations.
- `colorUtils.js` : holds all base functionality for color operations.
- `uiManager.js` : Dynamic UI build and app interactions.


For any problem or question, just drop me a line at [avin@avinvadas.com](mailto:avin@avinvadas.com)