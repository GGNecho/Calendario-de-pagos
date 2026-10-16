# Calendario de Pagos

Páginas privadas de Nemecio y María Fernanda para llevar pagos, gastos compartidos, notas e historial. Los datos viven en Firebase Firestore (proyecto `calendario-de-pagos-56e44`) y las páginas se publican en el hosting de Firebase: `https://calendario-de-pagos-56e44.firebaseapp.com` (mismo dominio que el inicio de sesión de Google, así funciona en iPhone). GitHub guarda el código; la dirección vieja de GitHub Pages solo redirige a la nueva (ver el inicio de `acceso.js`).

## Cómo trabajar aquí

- Todo en español: textos de la página, comentarios del código, mensajes de commit y respuestas al usuario.
- El usuario no es programador. Explica en palabras sencillas qué cambia en la página, no en el código.
- Publicar = `git push` (guardar el código) y luego `firebase.cmd deploy --only hosting` (lo que ven los dos). Pide confirmación antes de publicar. Revisa que `firebase.json` siga ignorando `.git/**`, `.claude/**` y los archivos de notas: todo lo demás de la carpeta queda público.
- La rama principal es `main` y es la que se publica. Trabaja y sube a `main`, salvo que el usuario pida otra cosa; no crees ramas nuevas sin preguntar.
- Git está en `C:\Program Files\Git\cmd\git.exe`; si `git` no está en el PATH de la sesión, usa esa ruta.
- Los mensajes de commit siguen el estilo del historial: una línea en español, en presente, que diga qué cambia para el usuario (por ejemplo "Agrega notas, historial y menú").

## Estructura

Sin build ni dependencias locales: HTML, CSS y JavaScript sueltos. Firebase se carga desde `gstatic.com` (versión compat 10.14.1). Cada página carga, en este orden: Firebase, `acceso.js`, `comun.js` y luego su propio `<script>` al final.

- `tablero.html`: Tablero (primera opción del menú y pantalla de inicio de la app instalada): corcho con marco de madera donde se pegan las notas (en la computadora se arrastran; la posición queda en `notes.pos`), la libreta del súper (`shopping`) y los tickets del mes; a un lado, un pizarrón con lo que hay que pagar antes de la nómina.
- `documentos.html`: pólizas, contratos, etc. (`documents`, foto en `docfotos`); sus vencimientos salen en la vista Mes.
- `index.html`: Calendario de Pagos (quincena y calendario). Al marcar un pago como hecho, se guarda en el historial.
- Notas (`notes`): se pegan en el Tablero; las terminadas (`status` history, calendar o done) se ven en el Historial. Una nota puede tener `tipo` (cita, cumple, otro; sin tipo = gasto o pendiente) y `fecha`: las que tienen fecha salen en la vista Mes (los cumpleaños cada año). Ver `TIPOS_NOTA` y `eventosDelMes()` en comun.js.
- `historial.html`: lo ya pagado, total por mes, comparación con el mes anterior, gasto por categoría contra el presupuesto y las notas terminadas.
- Gastos compartidos: el reparto de cada pago (% de Nemecio) se elige en el formulario del pago en el Calendario y se guarda en `shared/splits`; el medidor (`Comun.medidorRepartoHTML`) sale en el Tablero y en la Quincena.
- `acceso.js`: pantalla de entrada (Google o enlace por correo) y `window.requireAccess(onReady)`.
- `comun.js`: `window.Comun` con el menú, el tema de cada mes (`TEMAS_DEL_MES`: color, saludo, fondo de emojis y la guirnalda dibujada en `ADORNOS`; `diasEspeciales()` para el calendario; es el único lugar donde se definen), `conectar()`, `guardarEnHistorial()`, `esCompartido()`, `CATEGORIAS`, `hoyISO()` `quien()`, las fechas de los pagos (`nextDue`, `nextPayday`, `statusForDue`, `Comun.fechas`), `marcarPagado`/`desmarcarPago`/`pagarConAviso`, los tickets (`guardarTicket`, `verTicket`, `elegirFoto`) y `aviso()`. El Calendario y el Tablero usan estas mismas funciones: no las copies en una página.
- `estilo.css`: estilos compartidos (variables `--accent`, `--paper`, `--ink`, etc.).

Colecciones de Firestore: `payments`, `config/payroll`, `shared/splits`, `notes`, `history`, `tickets` (foto del recibo; mismo id que su entrada de `history`, que lleva `ticket: true`) , `shopping` (lista del súper), `documents` y `docfotos`, y `config/budgets` (presupuesto por categoría). `themes` ya no se usa (eran imágenes del mes que se quitaron). Las fotos (tickets, documentos) van en Firestore, nunca en el repositorio: el repositorio es público.

La app se puede instalar en el teléfono (`manifest.webmanifest`, `sw.js`, `icons/`). Si agregas una página, súmala a la lista `ARCHIVOS` de `sw.js` para que abra sin señal.

## Reglas que no se deben romper

- **Lista de correos con acceso**: está en dos lugares, `PERMITIDOS` en `acceso.js` y la lista de `firestore.rules`. Siempre cambia los dos juntos. Después de cambiar `firestore.rules`, publícalas con `firebase.cmd deploy --only firestore:rules` (Firebase CLI ya tiene la sesión del usuario), porque subirlas a GitHub no las aplica.
- Una página nueva debe cargar `acceso.js` y `comun.js`, usar `requireAccess` antes de leer datos, y agregarse a `PAGINAS` en `comun.js` para que salga en el menú.
- No cambies los nombres de colecciones ni de campos que ya existen: hay datos guardados con ellos. Si hace falta, lee ambos formatos (como hace `LLAVES_ANTERIORES`).
- Guarda en el historial con `Comun.guardarEnHistorial`; con un `id` fijo no se duplican registros.
- La configuración de Firebase en `comun.js` es pública por diseño (así funcionan las apps web); la seguridad la dan las reglas de Firestore.
- Las cuatro páginas ya comparten un diseño (fuentes, `estilo.css`, color de acento por mes). Al cambiar o agregar algo, sigue ese diseño; la skill `frontend-design` es para pantallas nuevas o rediseños que el usuario pida, no para cambiar el estilo por tu cuenta.
- Las páginas se usan sobre todo en el teléfono: revisa que los cambios se vean bien en pantalla angosta y en modo oscuro.

## Probar cambios

Abre la página con un servidor local (por ejemplo `npx serve` o `python -m http.server`). El inicio de sesión solo funciona en dominios autorizados en Firebase (`ggnecho.github.io`; `localhost` suele estar autorizado por defecto), así que para ver datos reales hace falta entrar con un correo permitido.
