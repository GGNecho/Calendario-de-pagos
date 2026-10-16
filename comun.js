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

  // ---------- Imágenes del mes ----------
  // Se guardan en Firestore (no en GitHub), así que solo las ven quienes entran:
  //   themes/m1…m12        → {v:{ranura:fecha}, color:{ranura:{h,s}}, usarColores, foco}
  //   themes/m1_portada…   → {data: imagen ya comprimida como data URI}
  // La del mes actual se guarda también en este dispositivo para que salga al instante.
  const RANURAS = ['portada','fondo','mascota'];
  const temas = {};          // mes → {meta, imgs:{portada, fondo, mascota}}
  let temaListo = false;     // ya hay sesión y se puede leer Firestore
  const CACHE_TEMA = 'tema-mes-v1';
  try{
    const c = JSON.parse(localStorage.getItem(CACHE_TEMA) || 'null');
    if(c && c.mes === new Date().getMonth()) temas[c.mes] = {meta:c.meta, imgs:c.imgs || {}};
  }catch(_){}
  function guardarCacheTema(mes){
    try{
      const t = temas[mes];
      if(t) localStorage.setItem(CACHE_TEMA, JSON.stringify({mes, meta:t.meta, imgs:t.imgs}));
    }catch(_){ try{ localStorage.removeItem(CACHE_TEMA); }catch(__){} }
  }

  // Colores: los de las imágenes si se pidió, si no los fijos del mes.
  function paletaDe(tema, t, dark){
    const m = t && t.meta;
    const c = m && m.usarColores !== false && m.color && (m.color.portada || m.color.fondo || m.color.mascota);
    if(c){
      const s = Math.max(45, Math.min(70, c.s));
      return dark ? {accent:`hsl(${c.h} ${s}% 72%)`, ink:`hsl(${c.h} 45% 15%)`}
                  : {accent:`hsl(${c.h} ${s}% 36%)`, ink:`hsl(${c.h} 70% 95%)`};
    }
    return dark ? tema.dark : tema.light;
  }

  // Aplica el tema de un mes (por defecto el actual). El Calendario lo llama al
  // moverse entre meses para que el color y las imágenes sigan al mes que se ve.
  function aplicarTema(mes){
    if(mes !== undefined) mesDelTema = mes;
    const tema = TEMAS_DEL_MES[mesDelTema];
    const t = temas[mesDelTema];
    const imgs = (t && t.imgs) || {};
    const dark = oscuro();
    const c = paletaDe(tema, t, dark);
    const root = document.documentElement.style;
    root.setProperty('--accent', c.accent);
    root.setProperty('--accent-ink', c.ink);
    if(imgs.fondo){
      // El patrón queda tenue con una capa del color del papel encima (sin capas extra que pesen al dibujar).
      const velo = dark ? 'rgba(14,19,17,.9)' : 'rgba(243,244,239,.88)';
      root.setProperty('--bg-image', `linear-gradient(${velo}, ${velo}), url("${imgs.fondo}")`);
      root.setProperty('--bg-size', 'auto, 220px');
    } else {
      root.setProperty('--bg-image', fondoSVG(tema, dark));
      root.removeProperty('--bg-size');
    }
    const linea = document.querySelector('.tema-mes span');
    if(linea) linea.textContent = 'Tema de ' + MESES[mesDelTema] + ': ' + tema.name + ' ' + tema.emoji;
    const portada = document.querySelector('.tema-portada');
    if(portada){
      portada.hidden = !imgs.portada;
      if(imgs.portada){
        portada.style.backgroundImage = `url("${imgs.portada}")`;
        portada.style.backgroundPosition = 'center ' + ((t.meta && t.meta.foco != null) ? t.meta.foco : 40) + '%';
      }
    }
    if(document.body) document.body.classList.toggle('con-portada', !!imgs.portada);
    const masc = document.querySelector('.tema-mascota');
    if(masc){
      masc.hidden = !imgs.mascota;
      if(imgs.mascota && masc.getAttribute('src') !== imgs.mascota) masc.src = imgs.mascota;
      const hero = masc.closest('.hero');
      if(hero) hero.classList.toggle('con-mascota', !!imgs.mascota);
    }
    if(temaListo && !t) cargarTema(mesDelTema);
  }

  const cargando = {};
  function cargarTema(mes){
    if(cargando[mes]) return cargando[mes];
    cargando[mes] = (async ()=>{
      try{
        const col = conectar().collection('themes');
        const snap = await col.doc('m'+(mes+1)).get();
        const meta = snap.exists ? snap.data() : null;
        const antes = temas[mes];
        const imgs = {};
        for(const r of RANURAS){
          const v = meta && meta.v && meta.v[r];
          if(!v) continue;
          // Si la imagen no cambió desde la última vez, se reutiliza sin volver a bajarla.
          if(antes && antes.meta && antes.meta.v && antes.meta.v[r] === v && antes.imgs[r]){ imgs[r] = antes.imgs[r]; continue; }
          const d = await col.doc('m'+(mes+1)+'_'+r).get();
          if(d.exists) imgs[r] = d.data().data;
        }
        temas[mes] = {meta, imgs};
        if(mes === new Date().getMonth()) guardarCacheTema(mes);
        if(mes === mesDelTema) aplicarTema();
        pintarEditor();
      }catch(_){
        // Sin conexión o sin permiso: se queda el tema fijo del mes.
      }finally{ delete cargando[mes]; }
    })();
    return cargando[mes];
  }

  aplicarTema();
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=> aplicarTema());

  // El saludo del mes va debajo del título; la portada, arriba; el personaje, junto al título.
  function pintarSaludo(){
    const h1 = document.querySelector('.hero h1');
    if(!h1 || document.querySelector('.tema-mes')) return;
    const p = document.createElement('p');
    p.className = 'tema-mes';
    p.innerHTML = '<span></span><button type="button" class="btn-link">Cambiar imágenes</button>';
    p.querySelector('button').addEventListener('click', abrirEditorTema);
    h1.insertAdjacentElement('afterend', p);
    const hero = h1.closest('.hero');
    if(hero){
      const portada = document.createElement('div');
      portada.className = 'tema-portada';
      portada.hidden = true;
      portada.setAttribute('aria-hidden', 'true');
      hero.parentNode.insertBefore(portada, hero);
      const masc = document.createElement('img');
      masc.className = 'tema-mascota';
      masc.alt = '';
      masc.hidden = true;
      hero.appendChild(masc);
    }
    aplicarTema();
  }
  if(document.body) pintarSaludo(); else document.addEventListener('DOMContentLoaded', pintarSaludo);

  // Al entrar con un correo permitido, se bajan las imágenes del mes.
  document.addEventListener('DOMContentLoaded', ()=>{
    if(typeof firebase === 'undefined') return;
    try{
      conectar();
      firebase.auth().onAuthStateChanged(u=>{
        if(!u || temaListo) return;
        temaListo = true;
        cargarTema(mesDelTema);
      });
    }catch(_){}
  });

  // ---------- Preparar una imagen antes de guardarla ----------
  function lienzo(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function escalar(c, max){
    const k = Math.min(1, max / Math.max(c.width, c.height));
    if(k >= 1) return c;
    const out = lienzo(Math.round(c.width*k), Math.round(c.height*k));
    out.getContext('2d').drawImage(c, 0, 0, out.width, out.height);
    return out;
  }
  function abrirArchivo(file){
    return new Promise((ok, mal)=>{
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = ()=>{ URL.revokeObjectURL(url); ok(img); };
      img.onerror = ()=>{ URL.revokeObjectURL(url); mal(new Error('imagen')); };
      img.src = url;
    });
  }
  // Si las cuatro esquinas son del mismo color, ese es el fondo: se vuelve
  // transparente lo que toca la orilla y se recorta al dibujo.
  function quitarFondo(c){
    const w = c.width, h = c.height, x = c.getContext('2d');
    const im = x.getImageData(0, 0, w, h), d = im.data;
    const esquinas = [0, w-1, (h-1)*w, h*w-1].map(p=>p*4);
    const bg = [0,1,2].map(j=> esquinas.reduce((s,i)=> s + d[i+j], 0) / 4);
    const parecido = i => { const a = d[i]-bg[0], b = d[i+1]-bg[1], e = d[i+2]-bg[2]; return a*a + b*b + e*e < 42*42; };
    if(!esquinas.every(parecido)) return c;
    const visto = new Uint8Array(w*h), pila = [];
    for(let a=0; a<w; a++) pila.push(a, (h-1)*w + a);
    for(let b=0; b<h; b++) pila.push(b*w, b*w + w - 1);
    while(pila.length){
      const p = pila.pop();
      if(visto[p]) continue;
      visto[p] = 1;
      if(!parecido(p*4)) continue;
      d[p*4+3] = 0;
      const a = p % w, b = (p - a) / w;
      if(a > 0) pila.push(p-1);
      if(a < w-1) pila.push(p+1);
      if(b > 0) pila.push(p-w);
      if(b < h-1) pila.push(p+w);
    }
    x.putImageData(im, 0, 0);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for(let b=0; b<h; b++) for(let a=0; a<w; a++){
      if(d[(b*w+a)*4+3] > 0){ if(a<x0) x0=a; if(a>x1) x1=a; if(b<y0) y0=b; if(b>y1) y1=b; }
    }
    if(x1 < 0) return c;
    const out = lienzo(x1-x0+1, y1-y0+1);
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }
  // El tono que más se repite entre los colores vivos de la imagen.
  function colorDominante(c){
    const s = lienzo(40, 40), x = s.getContext('2d');
    x.drawImage(c, 0, 0, 40, 40);
    const d = x.getImageData(0, 0, 40, 40).data;
    const peso = new Array(24).fill(0), sat = new Array(24).fill(0);
    for(let i=0; i<d.length; i+=4){
      if(d[i+3] < 128) continue;
      const r = d[i]/255, g = d[i+1]/255, b = d[i+2]/255;
      const mx = Math.max(r,g,b), mn = Math.min(r,g,b), l = (mx+mn)/2, ch = mx-mn;
      if(ch < 0.15 || l < 0.15 || l > 0.9) continue;
      const sv = ch / (1 - Math.abs(2*l - 1));
      let hh = mx===r ? ((g-b)/ch) % 6 : mx===g ? (b-r)/ch + 2 : (r-g)/ch + 4;
      hh = (hh*60 + 360) % 360;
      const k = Math.floor(hh/15);
      peso[k] += sv; sat[k] += sv*sv;
    }
    let k = 0;
    peso.forEach((v,i)=>{ if(v > peso[k]) k = i; });
    if(peso[k] <= 0) return null;
    return {h: k*15 + 7, s: Math.round(sat[k]/peso[k]*100)};
  }
  async function prepararImagen(file, ranura){
    const img = await abrirArchivo(file);
    const max = ranura==='portada' ? 1200 : ranura==='ticket' ? 1600 : ranura==='fondo' ? 480 : 900;
    let c = escalar((()=>{ const t = lienzo(img.naturalWidth, img.naturalHeight); t.getContext('2d').drawImage(img, 0, 0); return t; })(), max);
    if(ranura==='mascota') c = escalar(quitarFondo(c), 480);
    const color = colorDominante(c);
    let data;
    if(ranura==='mascota'){
      data = c.toDataURL('image/webp', 0.85);
      if(!data.startsWith('data:image/webp')) data = c.toDataURL('image/png');
      if(data.length > 900000) data = escalar(c, 320).toDataURL('image/png');
    } else {
      let q = 0.82;
      data = c.toDataURL('image/jpeg', q);
      while(data.length > 700000 && q > 0.4){ q -= 0.12; data = c.toDataURL('image/jpeg', q); }
    }
    if(data.length > 990000) throw new Error('grande');
    return {data, color};
  }

  // ---------- Ventana "Imágenes del mes" ----------
  const RANURA_NOMBRE = {portada:'Portada', fondo:'Fondo', mascota:'Personaje'};
  const RANURA_AYUDA = {
    portada:'Va arriba de cada página. Mejor una imagen horizontal.',
    fondo:'Se repite muy tenue detrás de todo. Ideal un patrón.',
    mascota:'Se asoma junto al título. Si tiene un fondo de un solo color, lo quito.',
  };
  let editor = null, mesEditor = 0, mesAntesDeEditar = 0;
  function estadoEditor(t){ const el = editor && editor.querySelector('#temaEstado'); if(el) el.textContent = t || ''; }
  function metaDe(mes){
    const t = temas[mes] || (temas[mes] = {meta:null, imgs:{}});
    t.meta = Object.assign({usarColores:true, foco:40, v:{}, color:{}}, t.meta || {});
    return t;
  }
  function guardarMeta(mes){
    const t = metaDe(mes);
    if(mes === new Date().getMonth()) guardarCacheTema(mes);
    return conectar().collection('themes').doc('m'+(mes+1)).set(t.meta);
  }
  function pintarEditor(){
    if(!editor || editor.hidden) return;
    const t = temas[mesEditor], meta = (t && t.meta) || {}, imgs = (t && t.imgs) || {};
    RANURAS.forEach(r=>{
      const prev = editor.querySelector('.tema-prev-'+r);
      prev.style.backgroundImage = imgs[r] ? `url("${imgs[r]}")` : 'none';
      editor.querySelector(`[data-subir="${r}"]`).textContent = imgs[r] ? 'Cambiar' : 'Subir';
      editor.querySelector(`[data-quitar="${r}"]`).hidden = !imgs[r];
    });
    editor.querySelector('#temaFocoWrap').hidden = !imgs.portada;
    editor.querySelector('#temaFoco').value = meta.foco != null ? meta.foco : 40;
    editor.querySelector('#temaColores').checked = meta.usarColores !== false;
  }
  function crearEditor(){
    editor = document.createElement('div');
    editor.className = 'modal-backdrop';
    editor.hidden = true;
    editor.innerHTML = `<div class="modal tema-editor" role="dialog" aria-modal="true" aria-labelledby="temaTitulo">
      <h2 id="temaTitulo">Imágenes del mes</h2>
      <div class="field"><label for="temaMes">Mes</label>
        <select id="temaMes">${MESES.map((n,i)=>`<option value="${i}">${n[0].toUpperCase()+n.slice(1)}</option>`).join('')}</select></div>
      ${RANURAS.map(r=>`<div class="tema-ranura">
        <span class="tema-prev tema-prev-${r}"></span>
        <div class="tema-info"><b>${RANURA_NOMBRE[r]}</b><span class="muted">${RANURA_AYUDA[r]}</span>
          <span class="tema-acciones"><button type="button" class="btn btn-small" data-subir="${r}">Subir</button>
          <button type="button" class="btn-link" data-quitar="${r}" hidden>Quitar</button></span></div>
        <input type="file" accept="image/*" data-archivo="${r}" hidden>
      </div>`).join('')}
      <div class="field" id="temaFocoWrap" hidden><label for="temaFoco">Qué parte de la portada se ve (arriba ↔ abajo)</label>
        <input type="range" id="temaFoco" min="0" max="100" step="5"></div>
      <div class="checkline"><input type="checkbox" id="temaColores"><label for="temaColores">Usar los colores de las imágenes</label></div>
      <p class="muted">Solo las ven ustedes dos: se guardan en su Firebase, no en GitHub.</p>
      <p class="muted tema-estado" id="temaEstado" aria-live="polite"></p>
      <div class="modal-actions"><button type="button" class="btn btn-primary" data-cerrar>Listo</button></div>
    </div>`;
    document.body.appendChild(editor);

    const cerrar = ()=>{ editor.hidden = true; estadoEditor(''); aplicarTema(mesAntesDeEditar); };
    editor.addEventListener('click', e=>{
      if(e.target === editor || e.target.closest('[data-cerrar]')) return cerrar();
      const sub = e.target.closest('[data-subir]');
      if(sub) return editor.querySelector(`[data-archivo="${sub.dataset.subir}"]`).click();
      const quitar = e.target.closest('[data-quitar]');
      if(quitar) quitarImagen(quitar.dataset.quitar);
    });
    editor.querySelector('#temaMes').addEventListener('change', e=>{
      mesEditor = Number(e.target.value);
      aplicarTema(mesEditor);   // la página muestra el mes que se edita
      pintarEditor();
      if(temaListo && !temas[mesEditor]) cargarTema(mesEditor);
    });
    editor.querySelectorAll('[data-archivo]').forEach(input=>{
      input.addEventListener('change', ()=>{
        const file = input.files && input.files[0];
        input.value = '';
        if(file) subirImagen(input.dataset.archivo, file);
      });
    });
    const foco = editor.querySelector('#temaFoco');
    foco.addEventListener('input', ()=>{ metaDe(mesEditor).meta.foco = Number(foco.value); aplicarTema(mesEditor); });
    foco.addEventListener('change', ()=> guardarMeta(mesEditor).catch(()=> estadoEditor('No se pudo guardar.')));
    editor.querySelector('#temaColores').addEventListener('change', e=>{
      metaDe(mesEditor).meta.usarColores = e.target.checked;
      aplicarTema(mesEditor);
      guardarMeta(mesEditor).catch(()=> estadoEditor('No se pudo guardar.'));
    });
  }
  function abrirEditorTema(){
    if(!editor) crearEditor();
    mesAntesDeEditar = mesEditor = mesDelTema;
    editor.querySelector('#temaMes').value = String(mesEditor);
    editor.hidden = false;
    estadoEditor(temaListo ? '' : 'Entra con tu cuenta para cambiar las imágenes.');
    pintarEditor();
  }
  async function subirImagen(r, file){
    if(!temaListo) return estadoEditor('Entra con tu cuenta para cambiar las imágenes.');
    const mes = mesEditor;
    estadoEditor('Preparando la imagen…');
    try{
      const res = await prepararImagen(file, r);
      estadoEditor('Guardando…');
      await conectar().collection('themes').doc('m'+(mes+1)+'_'+r).set({data: res.data});
      const t = metaDe(mes);
      t.meta.v = Object.assign({}, t.meta.v, {[r]: new Date().toISOString()});
      t.meta.color = Object.assign({}, t.meta.color);
      if(res.color) t.meta.color[r] = res.color; else delete t.meta.color[r];
      t.imgs = Object.assign({}, t.imgs, {[r]: res.data});
      await guardarMeta(mes);
      aplicarTema(mes);
      pintarEditor();
      estadoEditor('Listo, ya se ve en la página.');
    }catch(err){
      estadoEditor(err && err.message === 'grande' ? 'La imagen es demasiado grande. Prueba con otra.'
        : err && err.message === 'imagen' ? 'No se pudo abrir esa imagen.' : 'No se pudo guardar. Intenta de nuevo.');
    }
  }
  async function quitarImagen(r){
    const mes = mesEditor;
    try{
      const t = metaDe(mes);
      t.meta.v = Object.assign({}, t.meta.v); delete t.meta.v[r];
      t.meta.color = Object.assign({}, t.meta.color); delete t.meta.color[r];
      t.imgs = Object.assign({}, t.imgs); delete t.imgs[r];
      await guardarMeta(mes);
      conectar().collection('themes').doc('m'+(mes+1)+'_'+r).delete().catch(()=>{});
      aplicarTema(mes);
      pintarEditor();
      estadoEditor('Imagen quitada.');
    }catch(_){ estadoEditor('No se pudo quitar. Intenta de nuevo.'); }
  }

  const PAGINAS = [
    {href:'tablero.html',  label:'Tablero'},
    {href:'index.html',    label:'Calendario'},
    {href:'cuentas.html',  label:'Cuentas'},
    {href:'notas.html',    label:'Notas'},
    {href:'historial.html',label:'Historial'},
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

  // ---------- Fechas de los pagos (las usan el Calendario y el Tablero) ----------
  // Fechas como {y, m, d} con m de 0 a 11.
  function parseISO(s){ const p = s.split('-').map(Number); return {y:p[0], m:p[1]-1, d:p[2]}; }
  function toISO(o){ return String(o.y).padStart(4,'0')+'-'+String(o.m+1).padStart(2,'0')+'-'+String(o.d).padStart(2,'0'); }
  function toUTCms(o){ return Date.UTC(o.y, o.m, o.d); }
  function cmp(a, b){ return toUTCms(a) - toUTCms(b); }
  function daysInMonth(y, m){ return new Date(Date.UTC(y, m+1, 0)).getUTCDate(); }
  function addDays(o, n){ const dt = new Date(toUTCms(o) + n*86400000); return {y:dt.getUTCFullYear(), m:dt.getUTCMonth(), d:dt.getUTCDate()}; }
  function todayObj(){ const now = new Date(); return {y:now.getFullYear(), m:now.getMonth(), d:now.getDate()}; }
  function monthAbs(o){ return o.y*12 + o.m; }
  function fromMonthAbs(abs){ return {y:Math.floor(abs/12), m:((abs%12)+12)%12}; }
  function occurrenceAtMonth(abs, day, lastDay){
    const {y, m} = fromMonthAbs(abs);
    const dim = daysInMonth(y, m);
    return {y, m, d: lastDay ? dim : Math.min(day||1, dim)};
  }
  function diffDays(a, b){ return Math.round((toUTCms(a) - toUTCms(b)) / 86400000); }
  function weekdayMon(o){ return (new Date(Date.UTC(o.y, o.m, o.d)).getUTCDay() + 6) % 7; } // 0=lunes

  function nextMonthly(rule, today){
    const k = rule.monthsInterval || 1;
    const anchorAbs = monthAbs(parseISO(rule.anchorDate));
    let candAbs = anchorAbs + Math.max(0, Math.ceil((monthAbs(today) - anchorAbs) / k)) * k;
    let cand = occurrenceAtMonth(candAbs, rule.day, rule.lastDayOfMonth);
    for(let guard = 0; cmp(cand, today) < 0 && guard < 60; guard++){ candAbs += k; cand = occurrenceAtMonth(candAbs, rule.day, rule.lastDayOfMonth); }
    return cand;
  }
  function nextIntervalDays(rule, today){
    const anchor = parseISO(rule.anchorDate);
    return addDays(anchor, Math.max(0, Math.ceil(diffDays(today, anchor) / rule.intervalDays)) * rule.intervalDays);
  }
  function rawNext(rule, today){
    if(rule.recurrenceType === 'monthly') return nextMonthly(rule, today);
    if(rule.recurrenceType === 'interval_days') return nextIntervalDays(rule, today);
    return parseISO(rule.anchorDate);
  }
  // La primera fecha que todavía no se ha pagado, aunque ya haya pasado: así un pago
  // que se olvidó marcar aparece como vencido en vez de saltar solo al mes siguiente.
  // Sin pagos marcados, se cuenta desde que se creó.
  function nextDue(payment, today){
    if(payment.recurrenceType === 'one_time') return parseISO(payment.anchorDate);
    let from = today;
    if(payment.lastPaidDate) from = addDays(parseISO(payment.lastPaidDate), 1);
    else if(payment.createdAt) from = parseISO(String(payment.createdAt).slice(0,10));
    return rawNext(payment, from);
  }
  // La fecha que tocaba antes de `date` (null si no hay), para desmarcar un pago.
  function prevOccurrence(p, date){
    if(p.recurrenceType === 'monthly'){
      const abs = monthAbs(date) - (p.monthsInterval || 1);
      return abs < monthAbs(parseISO(p.anchorDate)) ? null : occurrenceAtMonth(abs, p.day, p.lastDayOfMonth);
    }
    if(p.recurrenceType === 'interval_days'){
      const d = addDays(date, -p.intervalDays);
      return cmp(d, parseISO(p.anchorDate)) < 0 ? null : d;
    }
    return null;
  }
  function nextPayday(payroll, today){
    const anchor = parseISO(payroll.anchorDate), n = payroll.intervalDays || 14;
    return addDays(anchor, Math.max(0, Math.floor(diffDays(today, anchor) / n) + 1) * n);
  }
  function statusForDue(dueDate, today){
    const dd = diffDays(dueDate, today);
    if(dd < 0) return {label:'Venció hace '+(-dd)+' día'+(-dd===1?'':'s'), cls:'critical'};
    if(dd === 0) return {label:'Hoy', cls:'critical'};
    if(dd === 1) return {label:'Mañana', cls:'warn'};
    if(dd <= 3) return {label:'en '+dd+' días', cls:'warn'};
    return {label:'en '+dd+' días', cls:'neutral'};
  }

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
  async function verTicket(db, historyId){
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
      const s = await db.collection('tickets').doc(historyId).get();
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
  };
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
  function conectar(){
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    return firebase.firestore();
  }

  // Quién escribió algo, para mostrar N o MF.
  function quien(email){
    if(!email) return '';
    return /^nemecio/i.test(email) ? '<span class="who a">N</span>' : '<span class="who b">MF</span>';
  }

  window.Comun = { esCompartido, LLAVES_ANTERIORES, guardarEnHistorial, hoyISO, CATEGORIAS, conectar, quien, elegirIcono, iconoHTML, aplicarTema, diasEspeciales,
    fechas: {parseISO, toISO, cmp, daysInMonth, addDays, todayObj, monthAbs, occurrenceAtMonth, diffDays, weekdayMon},
    nextDue, prevOccurrence, nextPayday, statusForDue, marcarPagado, desmarcarPago, pagarConAviso,
    elegirFoto, guardarTicket, borrarTicket, verTicket, aviso,
    TIPOS_NOTA, tipoDe, esFecha, eventosDelMes, fechaDeNota };
})();
