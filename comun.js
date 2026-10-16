// Piezas compartidas por las páginas: el menú de arriba, qué pagos se dividen
// entre los dos y cómo se guarda un gasto en el historial.
(function(){
  "use strict";

  const TEMAS_DEL_MES = [
    {emoji:'❄️', name:'Año Nuevo',        light:{accent:'#2B5F8A',ink:'#EAF4FB'}, dark:{accent:'#8FCBEA',ink:'#163044'}},
    {emoji:'💗', name:'San Valentín',      light:{accent:'#9C2F5C',ink:'#FBE7F0'}, dark:{accent:'#F0A8C4',ink:'#45182B'}},
    {emoji:'🌱', name:'Primavera',         light:{accent:'#2F7A4E',ink:'#E6F6EC'}, dark:{accent:'#8FE0AE',ink:'#163322'}},
    {emoji:'🌸', name:'Flores',            light:{accent:'#7A4FA6',ink:'#F3EAFB'}, dark:{accent:'#CBA8F0',ink:'#2E1C42'}},
    {emoji:'💐', name:'Día de las Madres', light:{accent:'#B23A6B',ink:'#FBE7EF'}, dark:{accent:'#F0A0C0',ink:'#3A1626'}},
    {emoji:'☀️', name:'Verano',            light:{accent:'#B4701A',ink:'#FBEEDC'}, dark:{accent:'#F0C878',ink:'#3A2A11'}},
    {emoji:'🌊', name:'Vacaciones',        light:{accent:'#1A7A8A',ink:'#E2F6F8'}, dark:{accent:'#7FE0EE',ink:'#0F3338'}},
    {emoji:'🌻', name:'Girasol',           light:{accent:'#B4820E',ink:'#FBF3DC'}, dark:{accent:'#F0D878',ink:'#3A2E0D'}},
    {emoji:'🇲🇽', name:'Mes Patrio',        light:{accent:'#2E7D4F',ink:'#EAF7EE'}, dark:{accent:'#8FE0AE',ink:'#163322'}},
    {emoji:'🎃', name:'Halloween',         light:{accent:'#B4530E',ink:'#FBE9DC'}, dark:{accent:'#F0A868',ink:'#3A200D'}},
    {emoji:'🎇', name:'Día de Muertos',    light:{accent:'#8A2F6E',ink:'#F8E6F2'}, dark:{accent:'#E0A0CC',ink:'#38162C'}},
    {emoji:'🎄', name:'Navidad',           light:{accent:'#A6271F',ink:'#FBE4E1'}, dark:{accent:'#F0978C',ink:'#3A130F'}},
  ];
  // El color de acento cambia con el mes, igual que en el Calendario.
  function aplicarTemaDelMes(){
    const tema = TEMAS_DEL_MES[new Date().getMonth()];
    const explicito = document.documentElement.getAttribute('data-theme');
    const oscuro = explicito ? explicito === 'dark' : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    const c = oscuro ? tema.dark : tema.light;
    document.documentElement.style.setProperty('--accent', c.accent);
    document.documentElement.style.setProperty('--accent-ink', c.ink);
  }
  aplicarTemaDelMes();
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicarTemaDelMes);

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

  window.Comun = { esCompartido, LLAVES_ANTERIORES, guardarEnHistorial, hoyISO, CATEGORIAS, conectar, quien, elegirIcono, iconoHTML };
})();
