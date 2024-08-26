ButtonSoup is a lightweight tool for making color themes. It can be experimented on [https://buttonsoup.xyz](https://buttonsoup.xyz/)

The tool is based on a single CSS file (colorSystem.css) with a relative color system, mathematically expends a single color value into a modifiable, fully functional color palette. The colorSystem.css file can be copied and used with no Javascript or build process necessary, and also externally available in the following gist:
https://gist.github.com/avinvadas/226b0c93417f0a28ce8c51f854ab3387.

Once downloading and importing it to your CSS:
```
@import url("colorSystem.css");
```

Once imported, you can hook the following CSS vars from the system and use them as design tokens for your CSS:
```

/* Primary scales */

--color-primary-100
--color-primary-200
--color-primary-300
--color-primary-400
--color-primary-500
--color-primary-600
--color-primary-700

/* Secondary scales */

--color-secondary-100
--color-secondary-200
--color-secondary-300
--color-secondary-400
--color-secondary-500
--color-secondary-600
--color-secondary-700

/* Accent01 palette */

--color-accent-01-a:
--color-accent-01-b:
--color-accent-01-c:
--color-accent-01-d:
--color-accent-01-e:

/* Accent02 palette */

--color-accent-02-a:
--color-accent-02-b
--color-accent-02-c
--color-accent-02-d
--color-accent-02-e

/* Accent03 palette */

--color-accent-03-a
--color-accent-03-b
--color-accent-03-c
--color-accent-03-d
--color-accent-03-e

/* Neutral darks scales */

--color-level-dark-100
--color-level-dark-200
--color-level-dark-300
--color-level-dark-400
--color-level-dark-500
--color-level-dark-600
--color-level-dark-700

/* Neutral bright scales */

--color-level-bright-100
--color-level-bright-200
--color-level-bright-300
--color-level-bright-400
--color-level-bright-500
--color-level-bright-600
--color-level-bright-700

}

```

You can adjust the system by updating its main CSS Vars:
If you are not sure where to start:

1. type your primary color into 
   --color-primary-hex
2. adjust the degree between the hues of primary and secondary colors through:
   --hue-dif
   
```
/* Exposed settings for the color management: */

--color-primary-hex: #000000; /* Set Primary color: */
--hue-dif: 180; /* Set Harmony type (0-360) */
--lightness: 50; /* Lightness scales medial point */
--lightness-black: 20; /* Dark scales brightest edge */
--lightness-white: 100; /* Bright scales brightest edge */
--saturation-factor: 5; /* Neutral scales Chroma level. 0 for absolute grayscale */
```

A working implementation to experiment with is available as a JSFiddle:
https://jsfiddle.net/avinvadas/t1cfs0bv/234/

More on relative color functions and how they work in CSS can be read here: [https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors)

### Local Env
```bash
docker build . -t buttonsoup
docker run -p 8080:80 buttonsoup
```

This is an open-source project, opened for personal and commercial use. For any problem or question, just drop me a line at [avin@avinvadas.com](mailto:avin@avinvadas.com)