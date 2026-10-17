// Avisos diarios: revisa qué vence hoy o mañana (pagos, cumpleaños, citas,
// documentos) y les manda UNA notificación con todo a los teléfonos que activaron
// los avisos en el Tablero. Lo corre GitHub Actions cada mañana (.github/workflows/avisos.yml).
//
// Necesita el secreto FIREBASE_SERVICE_ACCOUNT (la llave de servicio de Firebase en JSON).
// Con MODO=prueba manda un aviso de prueba aunque no venza nada.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const F = require('../fechas.js');

const SITIO = 'https://calendario-de-pagos-56e44.firebaseapp.com';
const money = new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN', maximumFractionDigits:0});
const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const EMOJI_NOTA = {cumple:'🎂', cita:'📌', otro:'⭐'};

// "Hoy" en Ciudad Madero (Tamaulipas usa la hora de Monterrey).
export function hoyEnMadero(ahora = new Date()){
  return F.parseISO(new Intl.DateTimeFormat('en-CA', {timeZone:'America/Monterrey'}).format(ahora));
}

// Arma las líneas del aviso. Es una función aparte para poder probarla sin Firebase.
export function lineasDelDia({payments = [], notes = [], documents = []}, hoy){
  const vencidos = [], hoyL = [], pronto = [];
  payments.filter(p => !(p.recurrenceType === 'one_time' && p.lastPaidDate)).forEach(p=>{
    const dd = F.diffDays(F.nextDue(p, hoy), hoy);
    const txt = p.name + ' ' + money.format(Number(p.amount || 0));
    if(dd < 0) vencidos.push(txt);
    else if(dd === 0) hoyL.push('💸 ' + txt);
    else if(dd === 1) pronto.push('💸 ' + txt);
  });
  notes.forEach(n=>{
    if(!n.fecha || !EMOJI_NOTA[n.tipo]) return;
    if(n.tipo !== 'cumple' && n.status !== 'open') return;
    const f = F.parseISO(n.fecha);
    // Los cumpleaños cuentan cada año: se compara solo mes y día.
    const fechas = n.tipo === 'cumple' ? [{y:hoy.y, m:f.m, d:f.d}, {y:hoy.y + 1, m:f.m, d:f.d}] : [f];
    const dd = Math.min(...fechas.map(x => F.diffDays(x, hoy)).filter(x => x >= 0), 99);
    if(dd === 0) hoyL.push(EMOJI_NOTA[n.tipo] + ' ' + n.text);
    else if(dd === 1) pronto.push(EMOJI_NOTA[n.tipo] + ' ' + n.text);
  });
  documents.forEach(d=>{
    if(!d.vence) return;
    const dd = F.diffDays(F.parseISO(d.vence), hoy);
    if(dd === 0) hoyL.push('📄 Vence hoy: ' + d.name);
    else if(dd === 1 || dd === 7 || dd === 30) pronto.push('📄 ' + d.name + ' vence en ' + dd + ' día' + (dd === 1 ? '' : 's'));
  });
  const lineas = [];
  if(hoyL.length) lineas.push('Hoy: ' + hoyL.join(', '));
  if(pronto.length) lineas.push('Pronto: ' + pronto.join(', '));
  if(vencidos.length) lineas.push('Vencidos: ' + vencidos.join(', '));
  return lineas;
}

async function main(){
  const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || 'null');
  if(!cuenta) throw new Error('Falta el secreto FIREBASE_SERVICE_ACCOUNT en GitHub.');
  const {default: admin} = await import('firebase-admin');
  admin.initializeApp({credential: admin.credential.cert(cuenta)});
  const db = admin.firestore();
  const lista = async c => (await db.collection(c).get()).docs.map(d => Object.assign({id:d.id}, d.data()));
  const hoy = hoyEnMadero();
  const prueba = process.env.MODO === 'prueba';

  const lineas = lineasDelDia({payments: await lista('payments'), notes: await lista('notes'), documents: await lista('documents')}, hoy);
  if(prueba) lineas.unshift('Aviso de prueba: si ves esto, los avisos ya funcionan.');
  console.log(`Hoy ${hoy.d} ${MES[hoy.m]} ${hoy.y}:`, lineas.length ? '\n  ' + lineas.join('\n  ') : 'nada que avisar');
  if(!lineas.length) return;

  const tokens = (await lista('pushTokens')).map(t => t.id);
  if(!tokens.length){ console.log('Nadie ha activado los avisos todavía.'); return; }
  // Mensaje solo con datos: el service worker de la app (sw.js) arma la notificación.
  const r = await admin.messaging().sendEachForMulticast({
    tokens,
    webpush: {
      data: {title: prueba ? 'Pagos: prueba' : 'Pagos de hoy', body: lineas.join('\n'), link: SITIO + '/tablero.html'},
      headers: {Urgency: 'high', TTL: '43200'},
    },
  });
  console.log(`Enviados: ${r.successCount}, fallidos: ${r.failureCount}`);
  // Los teléfonos que ya no existen (app borrada, permiso quitado) se sacan de la lista.
  const muertos = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'];
  await Promise.all(r.responses.map((x, i)=>{
    const c = x.error && x.error.code;
    if(muertos.includes(c)) return db.collection('pushTokens').doc(tokens[i]).delete();
    if(c) console.log('Error con un teléfono:', c);
  }));
}

// Solo corre si se llama directo (las pruebas importan las funciones de arriba).
if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  main().catch(e=>{ console.error(e.message || e); process.exit(1); });
}
