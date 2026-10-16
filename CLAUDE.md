# Calendario de Pagos

Páginas privadas de Nemecio y María Fernanda para llevar pagos, gastos compartidos, notas e historial. Los datos viven en Firebase Firestore (proyecto `calendario-de-pagos-56e44`) y las páginas se publican con GitHub Pages en `https://ggnecho.github.io/Calendario-de-pagos/`.

## Cómo trabajar aquí

- Todo en español: textos de la página, comentarios del código, mensajes de commit y respuestas al usuario.
- El usuario no es programador. Explica en palabras sencillas qué cambia en la página, no en el código.
- Subir a GitHub = publicar. Cada `git push` cambia la página que ven los dos. Pide confirmación antes de hacer push.
- La rama principal es `main` y es la que se publica. Trabaja y sube a `main`, salvo que el usuario pida otra cosa; no crees ramas nuevas sin preguntar.
- Git está en `C:\Program Files\Git\cmd\git.exe`; si `git` no está en el PATH de la sesión, usa esa ruta.
- Los mensajes de commit siguen el estilo del historial: una línea en español, en presente, que diga qué cambia para el usuario (por ejemplo "Agrega notas, historial y menú").

## Estructura

Sin build ni dependencias locales: HTML, CSS y JavaScript sueltos. Firebase se carga desde `gstatic.com` (versión compat 10.14.1). Cada página carga, en este orden: Firebase, `acceso.js`, `comun.js` y luego su propio `<script>` al final.

- `index.html`: Calendario de Pagos (quincena y calendario). Al marcar un pago como hecho, se guarda en el historial.
- `cuentas.html`: Cuentas de la Casa. Pagos del calendario marcados como "Gasto compartido" y el reparto entre los dos.
- `notas.html`: bloc de notas compartido; una nota se puede pasar al calendario o al historial.
- `historial.html`: lo ya pagado, total por mes, comparación con el mes anterior y gasto por categoría.
- `acceso.js`: pantalla de entrada (Google o enlace por correo) y `window.requireAccess(onReady)`.
- `comun.js`: `window.Comun` con el menú, el tema de color de cada mes, `conectar()`, `guardarEnHistorial()`, `esCompartido()`, `CATEGORIAS`, `hoyISO()` y `quien()`.
- `estilo.css`: estilos compartidos (variables `--accent`, `--paper`, `--ink`, etc.).

Colecciones de Firestore: `payments`, `config/payroll`, `shared/splits`, `notes` e `history`.

## Reglas que no se deben romper

- **Lista de correos con acceso**: está en dos lugares, `PERMITIDOS` en `acceso.js` y la lista de `firestore.rules`. Siempre cambia los dos juntos. Después de cambiar `firestore.rules`, recuérdale al usuario que debe pegarlas en Firebase (Firestore Database > Rules > Publicar), porque subirlas a GitHub no las aplica.
- Una página nueva debe cargar `acceso.js` y `comun.js`, usar `requireAccess` antes de leer datos, y agregarse a `PAGINAS` en `comun.js` para que salga en el menú.
- No cambies los nombres de colecciones ni de campos que ya existen: hay datos guardados con ellos. Si hace falta, lee ambos formatos (como hace `LLAVES_ANTERIORES`).
- Guarda en el historial con `Comun.guardarEnHistorial`; con un `id` fijo no se duplican registros.
- La configuración de Firebase en `comun.js` es pública por diseño (así funcionan las apps web); la seguridad la dan las reglas de Firestore.
- Las cuatro páginas ya comparten un diseño (fuentes, `estilo.css`, color de acento por mes). Al cambiar o agregar algo, sigue ese diseño; la skill `frontend-design` es para pantallas nuevas o rediseños que el usuario pida, no para cambiar el estilo por tu cuenta.
- Las páginas se usan sobre todo en el teléfono: revisa que los cambios se vean bien en pantalla angosta y en modo oscuro.

## Probar cambios

Abre la página con un servidor local (por ejemplo `npx serve` o `python -m http.server`). El inicio de sesión solo funciona en dominios autorizados en Firebase (`ggnecho.github.io`; `localhost` suele estar autorizado por defecto), así que para ver datos reales hace falta entrar con un correo permitido.
