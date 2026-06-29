# Landing estatica (HTML puro)

Carpeta: `landing-static-javer`

## Incluye

- `index.html`
- `styles.css`
- `script.js`
- `base-site.css` (CSS real descargado desde el sitio base)
- `refresh-base-css.sh` (script para volver a descargar CSS del sitio)
- `assets/images/` (imagenes copiadas del proyecto actual)

## Uso local rapido

1. Abre `index.html` en el navegador.
2. O levanta un servidor estatico:

```bash
cd landing-static-javer
python3 -m http.server 8080
```

Luego abre: `http://localhost:8080`

## Personalizacion

- Colores globales: `styles.css` en `:root`
- Textos y estructura: `index.html`
- Animaciones/menus: `script.js`

## Usar los mismos estilos del sitio base

La landing ya carga `base-site.css`, que contiene los bundles CSS del sitio en produccion.

Para refrescar cuando cambie el deploy del sitio:

```bash
cd landing-static-javer
./refresh-base-css.sh https://javerqa.online
```

## Copiar bloques desde la consola/DevTools

1. Abre la pagina base en el navegador.
2. En DevTools, copia el nodo HTML (Copy outerHTML).
3. Pegalo dentro de `index.html` en la seccion que quieras.
4. Guarda y recarga la landing local.

Con `base-site.css`, los elementos pegados conservan gran parte del look original (clases utilitarias, tipografia y espaciados).

## Nota

Es una base visual inspirada en tu home actual, sin React y sin consumo de APIs, para que puedas moverla y editarla facil.
