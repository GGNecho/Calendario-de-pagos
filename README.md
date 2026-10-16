# Calendario de Pagos

Páginas de Nemecio y María Fernanda, con los datos en Firebase Firestore (proyecto `calendario-de-pagos-56e44`). Se publican en https://ggnecho.github.io/Calendario-de-pagos/ y se pueden instalar en el teléfono como app.

- `tablero.html`: el tablero de los dos: notas pegadas en un corcho, la lista del súper, los tickets del mes y un pizarrón con lo que hay que pagar.
- `index.html`: Calendario de Pagos (quincena y mes). Al marcar un pago como hecho, se guarda en el historial.
- `historial.html`: lo que ya se pagó, total por mes, gasto por categoría con presupuesto y las notas terminadas.
- `documentos.html`: pólizas, contratos y demás, con foto y fecha de vencimiento.
- `acceso.js`: inicio de sesión. Solo entran los correos de la lista `PERMITIDOS`.
- `comun.js` y `estilo.css`: menú, temas del mes, fechas de pagos y estilos compartidos.
- `firestore.rules`: reglas de Firestore con la misma lista de correos. Se publican con `firebase deploy --only firestore:rules`.

## Para que funcione el acceso

1. En la consola de Firebase, en Authentication > Sign-in method, activa **Google** y **Correo electrónico/contraseña** con la opción **Vínculo de correo electrónico (acceso sin contraseña)**.
2. En Authentication > Settings > Authorized domains, agrega `ggnecho.github.io`.

Para dar acceso a otro correo, agrégalo en `acceso.js` y en `firestore.rules`, y publica las reglas.
