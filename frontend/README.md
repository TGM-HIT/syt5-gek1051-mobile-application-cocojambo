# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Headed Component Tests with [Cypress Component Testing](https://on.cypress.io/component)

```sh
npm run test:unit:dev # or `npm run test:unit` for headless testing
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

## Komponenten

### Startseite

Oben, auf einer Art Navigationsleiste gibt es 2 Eingabefelder (für Name und Kategorie) sowie einen Button zur Erstellung/Speicherung der neuen Liste. In der Mitte über die ganze Seite sind alle Listen aufgelistet. Ganz unten gibt es eine Art Footer, auf dem ebenfalls ein Textfeld mit einem Speichern-Button angezeigt werden

## Listenansicht

Nach Auswahl einer Liste kommt man auf die Listenansicht. In der Navigationsleiste stehen Name, Kategorie sowie ein Suchfeld zum einfacheren Finden von Elementen. Unter der Naviagtionsleiste sind 2 Bereiche aufgelistet. Der obere ist die eigentliche Liste, der untere ist eine Liste aller ausgeblendeten Elemente. In der Einkaufsliste stehe npro Element neben dem Produktnamen ein Button zum Ausblenden, ein Button zum Bearbeiten und ein Button zum Abhaken des Elements. Wird der Bearbeiten-Button geklickt, werden die 3 Buttons durch einen Speichern-Button ersetzt und der Name des Produkts wird in ein Textfeld mit dem Produkt als Text drinnen angezeigt.

Wird ein Produkt abgehakt, wird unter dem Produktnamen in einer kleineren Schrift mit niedrigerer Deckkraft das Datum und die Uhrzeit der Abhakung angezeigt und so in einer Unterliste bei mehreren Abhakungen angezeigt.
