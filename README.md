# Calendario de Pagos

Páginas de Nemecio y María Fernanda, con los datos en Firebase Firestore (proyecto `calendario-de-pagos-56e44`).

- `index.html`: Calendario de Pagos (quincena y calendario). Al marcar un pago como hecho, se guarda en el historial.
- `cuentas.html`: Cuentas de la Casa. Lista los pagos del calendario marcados como "Gasto compartido" y el reparto entre los dos.
- `notas.html`: bloc de notas compartido. Cada nota se puede pasar al calendario (por pagar) o al historial (ya pagado).
- `historial.html`: lo que ya se pagó, con total por mes, comparación con el mes anterior y gasto por categoría.
- `acceso.js`: inicio de sesión. Solo entran los correos de la lista `PERMITIDOS`.
- `comun.js` y `estilo.css`: menú, categorías y estilos compartidos.

En Firestore: `payments` (pagos), `config/payroll` (nómina), `shared/splits` (reparto), `notes` (notas) y `history` (historial).
- `firestore.rules`: reglas de Firestore con la misma lista de correos.

## Para que funcione el acceso

1. En la consola de Firebase, en Authentication > Sign-in method, activa **Google** y **Correo electrónico/contraseña** con la opción **Vínculo de correo electrónico (acceso sin contraseña)**.
2. En Authentication > Settings > Authorized domains, agrega `ggnecho.github.io`.
3. En Firestore Database > Rules, pega el contenido de `firestore.rules` y publica.

Para dar acceso a otro correo, agrégalo en `acceso.js` y en `firestore.rules`.
