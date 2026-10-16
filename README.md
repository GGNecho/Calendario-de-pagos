# Calendario de Pagos

Páginas de Nemecio y María Fernanda, con los datos en Firebase Firestore (proyecto `calendario-de-pagos-56e44`).

- `index.html`: Calendario de Pagos (quincena y calendario).
- `cuentas.html`: Cuentas de la Casa (reparto de gastos entre los dos, sincronizado).
- `acceso.js`: inicio de sesión. Solo entran los correos de la lista `PERMITIDOS`.
- `firestore.rules`: reglas de Firestore con la misma lista de correos.

## Para que funcione el acceso

1. En la consola de Firebase, en Authentication > Sign-in method, activa **Google** y **Correo electrónico/contraseña** con la opción **Vínculo de correo electrónico (acceso sin contraseña)**.
2. En Authentication > Settings > Authorized domains, agrega `ggnecho.github.io`.
3. En Firestore Database > Rules, pega el contenido de `firestore.rules` y publica.

Para dar acceso a otro correo, agrégalo en `acceso.js` y en `firestore.rules`.
