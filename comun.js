// Piezas compartidas por las páginas: el menú de arriba, qué pagos se dividen
// entre los dos y cómo se guarda un gasto en el historial.
(function(){
  "use strict";

  // ---------- Tema de cada mes ----------
  // Cada mes cambia el color de acento, el saludo bajo el título y un fondo muy
  // tenue con los dos emojis de `fondo`. Para cambiar un mes, edítalo solo aquí.
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const TEMAS_DEL_MES = [
    {emoji:'❄️', name:'Año Nuevo',        fondo:['❄️','🥂'], light:{accent:'#2B5F8A',ink:'#EAF4FB'}, dark:{accent:'#8FCBEA',ink:'#163044'}},
    {emoji:'💗', name:'San Valentín',      fondo:['💗','💌'], light:{accent:'#9C2F5C',ink:'#FBE7F0'}, dark:{accent:'#F0A8C4',ink:'#45182B'}},
    {emoji:'🌱', name:'Primavera',         fondo:['🌱','🦋'], light:{accent:'#2F7A4E',ink:'#E6F6EC'}, dark:{accent:'#8FE0AE',ink:'#163322'}},
    {emoji:'🌸', name:'Flores',            fondo:['🌸','🌷'], light:{accent:'#7A4FA6',ink:'#F3EAFB'}, dark:{accent:'#CBA8F0',ink:'#2E1C42'}},
    {emoji:'💐', name:'Día de las Madres', fondo:['💐','🌹'], light:{accent:'#B23A6B',ink:'#FBE7EF'}, dark:{accent:'#F0A0C0',ink:'#3A1626'}},
    {emoji:'☀️', name:'Verano',            fondo:['☀️','🍉'], light:{accent:'#B4701A',ink:'#FBEEDC'}, dark:{accent:'#F0C878',ink:'#3A2A11'}},
    {emoji:'🌊', name:'Vacaciones',        fondo:['🌊','🐚'], light:{accent:'#1A7A8A',ink:'#E2F6F8'}, dark:{accent:'#7FE0EE',ink:'#0F3338'}},
    {emoji:'🌻', name:'Girasol',           fondo:['🌻','🐝'], light:{accent:'#B4820E',ink:'#FBF3DC'}, dark:{accent:'#F0D878',ink:'#3A2E0D'}},
    {emoji:'🇲🇽', name:'Mes Patrio',        fondo:['🌶️','🎉'], light:{accent:'#2E7D4F',ink:'#EAF7EE'}, dark:{accent:'#8FE0AE',ink:'#163322'}},
    {emoji:'🎃', name:'Halloween',         fondo:['🎃','🦇'], light:{accent:'#B4530E',ink:'#FBE9DC'}, dark:{accent:'#F0A868',ink:'#3A200D'}},
    {emoji:'💀', name:'Día de Muertos',    fondo:['💀','🌼'], light:{accent:'#8A2F6E',ink:'#F8E6F2'}, dark:{accent:'#E0A0CC',ink:'#38162C'}},
    {emoji:'🎄', name:'Navidad',           fondo:['🎄','⭐'], light:{accent:'#A6271F',ink:'#FBE4E1'}, dark:{accent:'#F0978C',ink:'#3A130F'}},
  ];

  // Días especiales que se marcan en la vista Mes del Calendario.
  function diasEspeciales(y, m){
    const fijos = {
      0:{1:['🥂','Año Nuevo'], 6:['👑','Día de Reyes']},
      1:{2:['🫔','Día de la Candelaria'], 14:['💗','San Valentín']},
      3:{30:['🧸','Día del Niño']},
      4:{10:['💐','Día de las Madres']},
      8:{15:['🔔','Noche del Grito'], 16:['🇲🇽','Día de la Independencia']},
      9:{31:['🎃','Halloween']},
      10:{1:['🕯️','Día de Todos los Santos'], 2:['💀','Día de Muertos']},
      11:{12:['🌹','Día de la Virgen'], 24:['🌟','Nochebuena'], 25:['🎄','Navidad'], 31:['🥂','Fin de año']},
    };
    const out = Object.assign({}, fijos[m] || {});
    if(m === 5){ // Día del Padre: tercer domingo de junio
      const primero = new Date(y, 5, 1).getDay();
      out[1 + ((7 - primero) % 7) + 14] = ['👔','Día del Padre'];
    }
    return out;
  }

  function oscuro(){
    const explicito = document.documentElement.getAttribute('data-theme');
    return explicito ? explicito === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function fondoSVG(tema, dark){
    const [a, b] = tema.fondo;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><g opacity="${dark ? 0.07 : 0.09}" font-size="26">`
      + `<text x="22" y="52" transform="rotate(-14 36 42)">${a}</text><text x="112" y="140" transform="rotate(12 126 130)">${b}</text>`
      + `</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  let mesDelTema = new Date().getMonth();

  // ---------- Adornos del mes: una guirnalda dibujada arriba de cada página ----------
  const ADORNOS = [
    {forma:'copo',     colores:['#8FC1E3','#B9D7EE','#E8C55B']},           // enero
    {forma:'corazon',  colores:['#D6336C','#F783AC','#C2255C']},           // febrero
    {forma:'hoja',     colores:['#5C9E45','#8CC152','#3E7D32']},           // marzo
    {forma:'flor',     colores:['#B197FC','#F783AC','#9775FA']},           // abril
    {forma:'flor',     colores:['#F06595','#E64980','#FAA2C1']},           // mayo
    {forma:'sol',      colores:['#FCC419','#FD7E14']},                     // junio
    {forma:'banderin', colores:['#1098AD','#3BC9DB','#FFD43B','#74C0FC']}, // julio
    {forma:'girasol',  colores:['#FAB005','#F59F00']},                     // agosto
    {forma:'banderin', colores:['#2B8A3E','#F1F3F5','#C92A2A']},           // septiembre
    {forma:'calabaza', colores:['#F76707','#FD7E14','#E8590C']},           // octubre
    {forma:'papel',    colores:['#E64980','#F76707','#7048E8','#2F9E44','#FAB005','#1C7ED6']}, // noviembre
    {forma:'foco',     colores:['#FA5252','#FCC419','#40C057','#339AF0','#BE4BDB']},           // diciembre
  ];
  // Cada forma cuelga del punto (x, y) del hilo.
  function figura(f, c, x, y){
    const r = (n)=> Math.round(n*10)/10;
    switch(f){
      case 'banderin': return `<path d="M${r(x-15)} ${y}H${r(x+15)}L${x} ${y+30}Z" fill="${c}" stroke="rgba(0,0,0,.12)"/>`;
      case 'papel': return `<path fill-rule="evenodd" fill="${c}" d="M${x-17} ${y}h34v38l-5.7-4-5.7 4-5.7-4-5.7 4-5.7-4-5.7 4Z
        M${x} ${y+9}l6 7-6 7-6-7Z M${x-11} ${y+5}h5v5h-5Z M${x+6} ${y+5}h5v5h-5Z M${x-11} ${y+24}h5v5h-5Z M${x+6} ${y+24}h5v5h-5Z"/>`;
      case 'corazon': return `<path d="M${x} ${y}v7" stroke="rgba(0,0,0,.25)"/><path d="M${x} ${y+31}C${x-22} ${y+18} ${x-13} ${y+2} ${x} ${y+13}C${x+13} ${y+2} ${x+22} ${y+18} ${x} ${y+31}Z" fill="${c}"/>`;
      case 'foco': return `<circle cx="${x}" cy="${y+19}" r="15" fill="${c}" opacity=".22"/><rect x="${x-4}" y="${y}" width="8" height="7" rx="1.5" fill="#6c6f73"/><ellipse cx="${x}" cy="${y+18}" rx="7.5" ry="11" fill="${c}"/>`;
      case 'calabaza': return `<path d="M${x} ${y}v5" stroke="#5c3d1e" stroke-width="3"/><ellipse cx="${x-6}" cy="${y+18}" rx="8" ry="10" fill="${c}"/><ellipse cx="${x+6}" cy="${y+18}" rx="8" ry="10" fill="${c}"/><ellipse cx="${x}" cy="${y+18}" rx="7" ry="11" fill="${c}" stroke="rgba(0,0,0,.15)"/>`;
      case 'copo': { let s = `<path d="M${x} ${y}v5" stroke="rgba(0,0,0,.25)"/>`;
        for(let a=0; a<180; a+=60){ const rad = a*Math.PI/180, dx = r(Math.cos(rad)*12), dy = r(Math.sin(rad)*12);
          s += `<path d="M${r(x-dx)} ${r(y+17-dy)}L${r(x+dx)} ${r(y+17+dy)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; }
        return s + `<circle cx="${x}" cy="${y+17}" r="3" fill="${c}"/>`; }
      case 'hoja': return `<path d="M${x} ${y}C${x+14} ${y+10} ${x+10} ${y+26} ${x} ${y+32}C${x-10} ${y+26} ${x-14} ${y+10} ${x} ${y}Z" fill="${c}"/><path d="M${x} ${y+4}V${y+29}" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>`;
      case 'flor': { let s = `<path d="M${x} ${y}v5" stroke="#3e7d32" stroke-width="2"/>`;
        for(let k=0; k<5; k++){ const a = k*72*Math.PI/180; s += `<circle cx="${r(x+Math.cos(a)*7)}" cy="${r(y+17+Math.sin(a)*7)}" r="6" fill="${c}"/>`; }
        return s + `<circle cx="${x}" cy="${y+17}" r="4.2" fill="#FFD43B"/>`; }
      case 'sol': { let s = '';
        for(let k=0; k<8; k++){ const a = k*45*Math.PI/180;
          s += `<path d="M${r(x+Math.cos(a)*12)} ${r(y+17+Math.sin(a)*12)}L${r(x+Math.cos(a)*17)} ${r(y+17+Math.sin(a)*17)}" stroke="#FD7E14" stroke-width="2.5" stroke-linecap="round"/>`; }
        return `<path d="M${x} ${y}v3" stroke="rgba(0,0,0,.25)"/>` + s + `<circle cx="${x}" cy="${y+17}" r="9.5" fill="${c}"/>`; }
      case 'girasol': { let s = `<path d="M${x} ${y}v4" stroke="#3e7d32" stroke-width="2"/>`;
        for(let k=0; k<10; k++){ s += `<ellipse cx="${x}" cy="${y+8}" rx="3.6" ry="7" fill="${c}" transform="rotate(${k*36} ${x} ${y+17})"/>`; }
        return s + `<circle cx="${x}" cy="${y+17}" r="5.5" fill="#7a4b1c"/>`; }
    }
    return '';
  }
  // Tres "columpios" de hilo de lado a lado, con seis adornos colgando en cada uno.
  function guirnaldaSVG(mes){
    const a = ADORNOS[mes];
    let hilo = '', cosas = '', i = 0;
    for(let k=0; k<3; k++){
      const x0 = k*400, x2 = x0+400, xc = x0+200, y0 = 8, yc = 56;
      hilo += `<path d="M${x0} ${y0}Q${xc} ${yc} ${x2} ${y0}" fill="none" stroke="var(--ink-faint)" stroke-width="1.6"/><circle cx="${x0}" cy="${y0}" r="3.5" fill="var(--ink-soft)"/>`;
      for(let t=0.13; t<0.9; t+=0.148){
        const x = Math.round((1-t)*(1-t)*x0 + 2*(1-t)*t*xc + t*t*x2);
        const y = Math.round((1-t)*(1-t)*y0 + 2*(1-t)*t*yc + t*t*y0);
        const giro = ((i*37) % 13) - 6;
        cosas += `<g transform="rotate(${giro} ${x} ${y})">${figura(a.forma, a.colores[i % a.colores.length], x, y)}</g>`;
        i++;
      }
    }
    return `<svg viewBox="0 0 1200 92" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">${hilo}<circle cx="1200" cy="8" r="3.5" fill="var(--ink-soft)"/>${cosas}</svg>`;
  }

  // Aplica el tema de un mes (por defecto el actual): color de acento, fondo de emojis,
  // saludo y guirnalda. El Calendario lo llama al moverse entre meses.
  function aplicarTema(mes){
    if(mes !== undefined) mesDelTema = mes;
    const tema = TEMAS_DEL_MES[mesDelTema];
    const dark = oscuro();
    const c = dark ? tema.dark : tema.light;
    const root = document.documentElement.style;
    root.setProperty('--accent', c.accent);
    root.setProperty('--accent-ink', c.ink);
    root.setProperty('--bg-image', fondoSVG(tema, dark));
    const linea = document.querySelector('.tema-mes');
    if(linea) linea.textContent = 'Tema de ' + MESES[mesDelTema] + ': ' + tema.name + ' ' + tema.emoji;
    const g = document.querySelector('.guirnalda');
    if(g && g.dataset.mes !== String(mesDelTema)){ g.innerHTML = guirnaldaSVG(mesDelTema); g.dataset.mes = String(mesDelTema); }
  }
  aplicarTema();
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=> aplicarTema());

  // El saludo del mes va debajo del título; la guirnalda, arriba de todo.
  function pintarSaludo(){
    const h1 = document.querySelector('.hero h1');
    if(!h1 || document.querySelector('.tema-mes')) return;
    const p = document.createElement('p');
    p.className = 'tema-mes';
    h1.insertAdjacentElement('afterend', p);
    const hero = h1.closest('.hero');
    if(hero){
      const g = document.createElement('div');
      g.className = 'guirnalda';
      hero.parentNode.insertBefore(g, hero);
    }
    aplicarTema();
  }
  if(document.body) pintarSaludo(); else document.addEventListener('DOMContentLoaded', pintarSaludo);

  // ---------- Preparar una foto (ticket o documento) antes de guardarla ----------
  function lienzo(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function abrirArchivo(file){
    return new Promise((ok, mal)=>{
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = ()=>{ URL.revokeObjectURL(url); ok(img); };
      img.onerror = ()=>{ URL.revokeObjectURL(url); mal(new Error('imagen')); };
      img.src = url;
    });
  }
  // JPEG de hasta 1600 px por lado (se lee bien un ticket) y menos de ~700 KB, porque
  // un documento de Firestore no puede pasar de 1 MB.
  async function prepararImagen(file){
    const img = await abrirArchivo(file);
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = lienzo(Math.round(img.naturalWidth*k), Math.round(img.naturalHeight*k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    let q = 0.82, data = c.toDataURL('image/jpeg', q);
    while(data.length > 700000 && q > 0.4){ q -= 0.12; data = c.toDataURL('image/jpeg', q); }
    if(data.length > 990000) throw new Error('grande');
    return {data};
  }

  const PAGINAS = [
    {href:'tablero.html',  label:'Tablero'},
    {href:'index.html',    label:'Calendario'},
    {href:'historial.html',label:'Historial'},
    {href:'documentos.html',label:'Documentos'},
  ];

  const css = `
  .menu{ position:sticky; top:0; z-index:30; display:flex; justify-content:safe center; gap:4px; padding:8px 12px; overflow-x:auto; scrollbar-width:none; white-space:nowrap;
    padding-top:calc(8px + env(safe-area-inset-top,0px));
    background:color-mix(in srgb, var(--paper,#F2F4EE) 88%, transparent);
    -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-bottom:1px solid var(--border,#E1E5D6); }
  .menu a{ flex:0 0 auto; font:600 13.5px var(--font-body,-apple-system,BlinkMacSystemFont,sans-serif); color:var(--ink-soft,#5B6660);
    text-decoration:none; padding:7px 12px; border-radius:999px; }
  .menu a:hover{ color:var(--ink,#1C2621); }
  .menu a.activa{ background:var(--ink,#1C2621); color:var(--paper,#F2F4EE); }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function pintarMenu(){
    const actual = (location.pathname.split('/').pop() || 'index.html');
    const nav = document.createElement('nav');
    nav.className = 'menu';
    nav.innerHTML = PAGINAS.map(p=>`<a href="${p.href}"${p.href===actual?' class="activa" aria-current="page"':''}>${p.label}</a>`).join('');
    document.body.insertBefore(nav, document.body.firstChild);
    const salir = document.querySelector('.acceso-salir');
    if(salir) nav.appendChild(salir);
  }
  if(document.body) pintarMenu(); else document.addEventListener('DOMContentLoaded', pintarMenu);

  // Pagos que se dividen entre los dos aunque todavía no tengan la casilla
  // "Gasto compartido" guardada (los 8 de la lista original de Cuentas de la Casa).
  const COMPARTIDOS_INICIALES = ['p1','p2','p3','p4','p5','p6','p7','p8'];
  // El reparto se guardaba con estos nombres antes de leer los pagos del calendario.
  const LLAVES_ANTERIORES = {renta:'p1', internet:'p2', apple:'p3', telmar:'p4', telnem:'p5', agua:'p6', luz:'p7', gas:'p8'};

  // Reparto de los gastos compartidos: shared/splits → {idDelPago: % que le toca a Nemecio}.
  // Sin dato, mitad y mitad. Pasa los nombres viejos (renta, luz…) a los ids de los pagos.
  function leerReparto(obj){
    const out = Object.assign({}, obj || {});
    Object.entries(LLAVES_ANTERIORES).forEach(([viejo, nuevo])=>{
      if(out[viejo] != null && out[nuevo] == null) out[nuevo] = out[viejo];
      delete out[viejo];
    });
    return out;
  }
  // Cuánto de los pagos compartidos (cada vez que tocan) le toca a cada quien.
  function cargoPorPersona(payments, splits){
    let a = 0, b = 0;
    (payments || []).filter(esCompartido).forEach(p=>{
      const amt = Number(p.amount || 0), pct = splits && splits[p.id] != null ? splits[p.id] : 50;
      a += amt * pct / 100; b += amt * (100 - pct) / 100;
    });
    return {a, b};
  }
  // Medidor de media luna: la parte de Nemecio (izquierda) y la de María Fernanda (derecha).
  function medidorRepartoHTML({a, b}){
    const money = new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN', maximumFractionDigits:0});
    const total = a + b, pa = total ? a / total : 0.5, L = 125.7; // largo del arco de radio 40
    return `<div class="medidor" role="img" aria-label="Cargado a Nemecio ${money.format(a)}, a María Fernanda ${money.format(b)}">
      <svg viewBox="0 0 100 56" aria-hidden="true">
        <path d="M10 50A40 40 0 0 1 90 50" fill="none" stroke="var(--person-b)" stroke-width="10"/>
        <path d="M10 50A40 40 0 0 1 90 50" fill="none" stroke="var(--person-a)" stroke-width="10" stroke-dasharray="${(pa*L).toFixed(1)} ${L}"/>
        <text x="50" y="47" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">${Math.round(pa*100)}% / ${100-Math.round(pa*100)}%</text>
      </svg>
      <div class="medidor-nombres"><span class="a">N ${money.format(a)}</span><span class="b">MF ${money.format(b)}</span></div>
    </div>`;
  }

  function esCompartido(p){
    if(p.recurrenceType === 'one_time') return false;
    if(typeof p.shared === 'boolean') return p.shared;
    return COMPARTIDOS_INICIALES.includes(p.id);
  }

  function hoyISO(){
    const d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  // Guarda un gasto en el historial. Con `id` fijo, repetir la misma acción no duplica.
  function guardarEnHistorial(db, gasto, id){
    const user = firebase.auth().currentUser;
    const data = Object.assign({
      date: hoyISO(),
      category: 'personal',
      notes: '',
      source: 'manual',
      by: user ? user.email : null,
      createdAt: new Date().toISOString(),
    }, gasto);
    data.amount = Number(data.amount) || 0;
    const col = db.collection('history');
    return id ? col.doc(id).set(data) : col.add(data);
  }

  // Icono de cada pago: un emoji según el nombre sobre un color fijo por nombre,
  // para que el mismo pago se vea igual en todas las páginas.
  const COLORES_ICONO = ['#3478F6','#1DB954','#E4405F','#FF8A3D','#B454E0','#00B8A9','#F2B705','#5B6EF5'];
  const ICONOS = [
    [/renta|alquiler|hipoteca/i,'🏠'],
    [/internet|wifi|megacable|izzi|totalplay|fibra/i,'📶'],
    [/telcel|movistar|at&t|unefon|celular|tel[ée]fono/i,'📱'],
    [/apple/i,'🍎'],
    [/netflix/i,'🎬'],
    [/spotify|m[úu]sica/i,'🎵'],
    [/agua/i,'💧'],
    [/luz|cfe|iberdrola|electric/i,'💡'],
    [/\bgas\b/i,'🔥'],
    [/gym|synergym|gimnasio/i,'🏋️'],
    [/google/i,'🔷'],
    [/chatgpt|openai/i,'🤖'],
    [/invest|ahorro|invers/i,'💼'],
    [/disney|hbo|max|prime/i,'📺'],
    [/seguro/i,'🛡️'],
  ];
  function hash(t){ let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0; return h; }
  function elegirIcono(name, category){
    name = String(name||'');
    let emoji = null;
    for(const [re,em] of ICONOS){ if(re.test(name)){ emoji = em; break; } }
    if(!emoji) emoji = category==='negocio' ? '💼' : category==='suscripcion' ? '⭐' : '💳';
    return {emoji, color: COLORES_ICONO[hash(name)%COLORES_ICONO.length]};
  }
  // `cls` es la clase de la página que da el tamaño (icon-tile, item-icon…).
  function iconoHTML(p, cls, title){
    const t = title ? ` title="${String(title).replace(/"/g,'&quot;')}"` : '';
    if(p.iconDataUri) return `<span class="${cls}" style="background:var(--surface-2)"${t}><img src="${p.iconDataUri}" alt=""></span>`;
    const ic = elegirIcono(p.name, p.category);
    return `<span class="${cls}" style="background:${ic.color}"${t}>${ic.emoji}</span>`;
  }

  // Las fechas de los pagos viven en fechas.js (también las usa el programa de avisos).
  const {parseISO, toISO, cmp, daysInMonth, addDays, todayObj, monthAbs, occurrenceAtMonth, diffDays, weekdayMon,
    nextDue, prevOccurrence, nextPayday, statusForDue} = window.Fechas;
  // Marca como pagada la fecha `dueISO` y la guarda en el Historial con id fijo
  // (pago_fecha), para no duplicar. Devuelve {antes, historyId, historial}: `antes`
  // sirve para deshacer y `historial` es la promesa de la entrada del Historial.
  // Se guarda la FECHA QUE TOCABA (no la de hoy) para que el ciclo cuente como
  // pagado aunque se pague antes o tarde.
  function marcarPagado(db, p, dueISO){
    const antes = p.lastPaidDate || null;
    const historyId = p.id + '_' + dueISO;
    return db.collection('payments').doc(p.id).update({lastPaidDate: dueISO}).then(()=>({
      antes, historyId,
      historial: guardarEnHistorial(db, {
        name: p.name, amount: p.amount, category: p.category, date: hoyISO(),
        dueDate: dueISO, paymentId: p.id, source: 'calendario',
      }, historyId),
    }));
  }
  // Quita la marca de la fecha `dueISO`, su entrada del Historial y su ticket.
  // `volverA` es la marca anterior si se sabe (al deshacer); si no, la fecha anterior que tocaba.
  function desmarcarPago(db, p, dueISO, volverA){
    let back = volverA;
    if(back === undefined){ const prev = prevOccurrence(p, parseISO(dueISO)); back = prev ? toISO(prev) : null; }
    const hid = p.id + '_' + dueISO;
    return db.collection('payments').doc(p.id).update({lastPaidDate: back}).then(()=>{
      db.collection('history').doc(hid).delete().catch(()=>{});
      db.collection('tickets').doc(hid).delete().catch(()=>{});
    });
  }

  // Marca como pagado y avisa con dos botones: "Ticket" (adjuntar la foto del
  // comprobante) y "Deshacer". Si falla al marcar, la promesa falla.
  function pagarConAviso(db, p, dueISO){
    return marcarPagado(db, p, dueISO).then(r=>{
      aviso('Marcado como pagado', [
        {label:'📎 Ticket', run: ()=> elegirFoto().then(f=>{
          if(!f) return;
          aviso('Guardando el ticket…');
          return r.historial.then(()=> guardarTicket(db, r.historyId, f))
            .then(()=> aviso('Ticket guardado'), ()=> aviso('No se pudo guardar el ticket.'));
        })},
        {label:'Deshacer', run: ()=> desmarcarPago(db, p, dueISO, r.antes)
          .then(()=> aviso('Pago desmarcado'), ()=> aviso('No se pudo desmarcar. Intenta de nuevo.'))},
      ]);
      return r;
    });
  }

  // ---------- Tickets (fotos de recibos) ----------
  // tickets/{id de la entrada del Historial} → {data: foto comprimida}; la entrada lleva ticket:true.
  function elegirFoto(){
    // Se llama dentro del clic del usuario: el teléfono ofrece cámara o galería.
    return new Promise(ok=>{
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', ()=> ok(input.files && input.files[0] || null));
      input.click();
    });
  }
  async function guardarTicket(db, historyId, file){
    const {data} = await prepararImagen(file, 'ticket');
    const u = firebase.auth().currentUser;
    await db.collection('tickets').doc(historyId).set({data, by: u ? u.email : null, createdAt: new Date().toISOString()});
    await db.collection('history').doc(historyId).update({ticket: true});
  }
  function borrarTicket(db, historyId){ return db.collection('tickets').doc(historyId).delete(); }
  let visor = null;
  async function verTicket(db, historyId, coleccion){ // coleccion: 'tickets' (por defecto) o 'docfotos'
    if(!visor){
      visor = document.createElement('div');
      visor.className = 'modal-backdrop ticket-visor';
      visor.hidden = true;
      visor.innerHTML = '<div class="modal"><p class="muted" data-estado>Cargando el ticket…</p><img alt="Ticket"><div class="modal-actions"><button type="button" class="btn btn-primary" data-cerrar>Cerrar</button></div></div>';
      visor.addEventListener('click', e=>{ if(e.target === visor || e.target.closest('[data-cerrar]')) visor.hidden = true; });
      document.body.appendChild(visor);
    }
    const img = visor.querySelector('img'), estado = visor.querySelector('[data-estado]');
    img.hidden = true; estado.hidden = false; estado.textContent = 'Cargando el ticket…';
    visor.hidden = false;
    try{
      const s = await db.collection(coleccion || 'tickets').doc(historyId).get();
      if(!s.exists){ estado.textContent = 'No se encontró el ticket.'; return; }
      img.src = s.data().data; img.hidden = false; estado.hidden = true;
    }catch(_){ estado.textContent = 'No se pudo cargar el ticket.'; }
  }

  // ---------- Tipos de nota y fechas en el calendario ----------
  // Una nota sin `tipo` es un gasto o pendiente (como las de antes). Las demás pueden
  // llevar `fecha` (AAAA-MM-DD) y salen en la vista Mes; los cumpleaños se repiten cada año.
  const TIPOS_NOTA = {
    gasto:  {emoji:'💸', label:'Gasto o pendiente'},
    cita:   {emoji:'📌', label:'Cita'},
    cumple: {emoji:'🎂', label:'Cumpleaños'},
    otro:   {emoji:'⭐', label:'Otra fecha'},
    // Solo para el calendario: vencimientos de la página Documentos (no se elige al escribir una nota).
    doc:    {emoji:'📄', label:'Vence un documento', sistema:true},
  };
  // Las opciones de tipo para los formularios de notas (sin los de uso interno).
  function opcionesTipoNota(){
    return Object.entries(TIPOS_NOTA).filter(([,t])=> !t.sistema).map(([k,t])=>`<option value="${k}">${t.emoji} ${t.label}</option>`).join('');
  }
  // Los documentos con fecha de vencimiento, con la forma de una nota para el calendario.
  function documentosComoFechas(docs){
    return (docs || []).filter(d=> d.vence).map(d=>({id:'doc_'+d.id, text:'Vence: ' + d.name, tipo:'doc', fecha:d.vence, status:'open'}));
  }

  // Liga para agregar algo a Google Calendar (con el aviso que tenga ese calendario).
  // `repetir`: 'MONTHLY', 'YEARLY' o 'DAILY', con `cada` = intervalo.
  function enlaceCalendario({titulo, fechaISO, detalles, repetir, cada}){
    const d = fechaISO.replace(/-/g, '');
    const sig = toISO(addDays(parseISO(fechaISO), 1)).replace(/-/g, '');
    const q = new URLSearchParams({action:'TEMPLATE', text:titulo, dates: d + '/' + sig, details: detalles || 'Del Calendario de Pagos'});
    if(repetir) q.set('recur', 'RRULE:FREQ=' + repetir + (cada > 1 ? ';INTERVAL=' + cada : ''));
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }
  function tipoDe(n){ return TIPOS_NOTA[n.tipo] ? n.tipo : 'gasto'; }
  function esFecha(n){ return tipoDe(n) !== 'gasto'; }
  // Las notas con fecha que caen en ese mes: [{d, nota, tipo}] ordenadas por día.
  function eventosDelMes(notes, y, m){
    const out = [];
    (notes || []).forEach(n=>{
      if(!n.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(n.fecha)) return;
      const f = parseISO(n.fecha);
      if(f.m !== m) return;
      if(tipoDe(n) === 'cumple' ? f.y > y : f.y !== y) return;
      out.push({d: Math.min(f.d, daysInMonth(y, m)), nota: n, tipo: tipoDe(n)});
    });
    return out.sort((a,b)=> a.d - b.d);
  }
  const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  // "🎂 3 nov" para mostrar en la tarjeta de una nota con fecha.
  function fechaDeNota(n){
    const t = TIPOS_NOTA[tipoDe(n)];
    if(!esFecha(n)) return '';
    if(!n.fecha) return t.emoji + ' ' + t.label;
    const f = parseISO(n.fecha);
    return t.emoji + ' ' + f.d + ' ' + MES_CORTO[f.m] + (tipoDe(n) !== 'cumple' && f.y !== new Date().getFullYear() ? ' ' + f.y : '');
  }

  // ---------- Aviso abajo de la pantalla ----------
  // `acciones`: [{label, run}] botones como "Deshacer" o "Agregar ticket".
  function aviso(msg, acciones){
    let t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    (acciones || []).forEach(a=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', ()=>{ t.hidden = true; a.run(); });
      t.appendChild(b);
    });
    t.hidden = false;
    clearTimeout(aviso._t);
    aviso._t = setTimeout(()=>{ t.hidden = true; }, acciones && acciones.length ? 8000 : 2600);
  }

  const CATEGORIAS = {
    super:'Súper', comida:'Comida fuera', casa:'Casa', transporte:'Transporte', salud:'Salud',
    ocio:'Entretenimiento', personal:'Pagos fijos', suscripcion:'Suscripciones', negocio:'Negocio', otro:'Otro',
  };

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDLV3ozEUZ8XrybKQIrYUA7PY33GKnsFwY",
    authDomain: "calendario-de-pagos-56e44.firebaseapp.com",
    projectId: "calendario-de-pagos-56e44",
    storageBucket: "calendario-de-pagos-56e44.firebasestorage.app",
    messagingSenderId: "783588307830",
    appId: "1:783588307830:web:8b48c58d61b53cbb304057"
  };
  // ---------- Avisos en el teléfono ----------
  // La llave pública de "Certificados push web" (Firebase > Configuración > Cloud Messaging).
  // Es pública por diseño: solo identifica a la app; mandar avisos requiere la llave privada de servicio.
  const LLAVE_AVISOS = 'BPNRaaxsQvagmDUMmhQI-lEzHyOd6PMgHl8qNugzX9mebevlASY-7uWgmPZbsbg20KwRcb_jxoXnmTPO9KqFR64';
  const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
  const instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function cargarScript(src){
    return new Promise((ok, mal)=>{ const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  }
  // Pide permiso (si hace falta), obtiene el "domicilio" del teléfono para los avisos y lo
  // guarda en pushTokens. `preguntar` en false solo lo renueva si ya había permiso.
  async function activarAvisos(preguntar){
    if(!LLAVE_AVISOS) throw new Error('sin-llave');
    if(esIOS && !instalada) throw new Error('instalar');
    if(!('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('no-soportado');
    if(Notification.permission !== 'granted'){
      if(!preguntar) return false;
      if(await Notification.requestPermission() !== 'granted') throw new Error('sin-permiso');
    }
    if(!firebase.messaging) await cargarScript('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
    if(!(await firebase.messaging.isSupported())) throw new Error('no-soportado');
    conectar();
    const reg = await navigator.serviceWorker.ready;
    const token = await firebase.messaging().getToken({vapidKey: LLAVE_AVISOS, serviceWorkerRegistration: reg});
    const u = firebase.auth().currentUser;
    await conectar().collection('pushTokens').doc(token).set({email: u ? u.email : null, ios: esIOS, updatedAt: new Date().toISOString()});
    return true;
  }
  function avisosActivos(){ return 'Notification' in window && Notification.permission === 'granted' && !!LLAVE_AVISOS; }

  // Para instalarla como app y que abra sin señal (ver sw.js).
  if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(()=>{});

  // La primera vez se activa la copia en el teléfono: si se va la señal se ven los
  // datos guardados y lo que cambien se sube solo al volver.
  let conectado = false;
  function conectar(){
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.firestore();
    if(!conectado){
      conectado = true;
      if(db.enablePersistence) db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
    }
    return db;
  }

  // Quién escribió algo, para mostrar N o MF.
  function quien(email){
    if(!email) return '';
    return /^nemecio/i.test(email) ? '<span class="who a">N</span>' : '<span class="who b">MF</span>';
  }

  window.Comun = { esCompartido, LLAVES_ANTERIORES, leerReparto, cargoPorPersona, medidorRepartoHTML, guardarEnHistorial, hoyISO, CATEGORIAS, conectar, quien, elegirIcono, iconoHTML, aplicarTema, diasEspeciales,
    fechas: {parseISO, toISO, cmp, daysInMonth, addDays, todayObj, monthAbs, occurrenceAtMonth, diffDays, weekdayMon},
    nextDue, prevOccurrence, nextPayday, statusForDue, marcarPagado, desmarcarPago, pagarConAviso,
    elegirFoto, guardarTicket, borrarTicket, verTicket, aviso,
    TIPOS_NOTA, tipoDe, esFecha, eventosDelMes, fechaDeNota, opcionesTipoNota, documentosComoFechas, enlaceCalendario, prepararImagen,
    activarAvisos, avisosActivos };
})();
