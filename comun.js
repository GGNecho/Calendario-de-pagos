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
  // Aplica el tema de un mes (por defecto el actual). El Calendario lo llama al
  // moverse entre meses para que el color siga al mes que se está viendo.
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
  }
  aplicarTema();
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=> aplicarTema());

  // El saludo del mes va justo debajo del título de cada página.
  function pintarSaludo(){
    const h1 = document.querySelector('.hero h1');
    if(!h1 || document.querySelector('.tema-mes')) return;
    const p = document.createElement('p');
    p.className = 'tema-mes';
    h1.insertAdjacentElement('afterend', p);
    aplicarTema();
  }
  if(document.body) pintarSaludo(); else document.addEventListener('DOMContentLoaded', pintarSaludo);

  const PAGINAS = [
    {href:'index.html',    label:'Calendario'},
    {href:'cuentas.html',  label:'Cuentas'},
    {href:'notas.html',    label:'Notas'},
    {href:'historial.html',label:'Historial'},
  ];

  const css = `
  .menu{ position:sticky; top:0; z-index:30; display:flex; justify-content:center; gap:4px; padding:8px 12px;
    padding-top:calc(8px + env(safe-area-inset-top,0px));
    background:color-mix(in srgb, var(--paper,#F2F4EE) 88%, transparent);
    -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-bottom:1px solid var(--border,#E1E5D6); }
  .menu a{ font:600 13.5px var(--font-body,-apple-system,BlinkMacSystemFont,sans-serif); color:var(--ink-soft,#5B6660);
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
  function conectar(){
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    return firebase.firestore();
  }

  // Quién escribió algo, para mostrar N o MF.
  function quien(email){
    if(!email) return '';
    return /^nemecio/i.test(email) ? '<span class="who a">N</span>' : '<span class="who b">MF</span>';
  }

  window.Comun = { esCompartido, LLAVES_ANTERIORES, guardarEnHistorial, hoyISO, CATEGORIAS, conectar, quien, elegirIcono, iconoHTML, aplicarTema, diasEspeciales };
})();
