// Acceso con Google para las páginas del Calendario de Pagos.
// Solo los correos de PERMITIDOS pueden entrar. Esta lista es para que la
// página muestre un aviso claro; quien de verdad bloquea el acceso son las
// reglas de Firestore (ver firestore.rules), que usan la misma lista.
// La página vive en el hosting de Firebase, en el mismo dominio que el inicio de
// sesión de Google (así funciona en iPhone). Las direcciones viejas mandan aquí.
(function(){
  const CASA = 'calendario-de-pagos-56e44.firebaseapp.com';
  const h = location.hostname;
  if(h.endsWith('github.io') || h.endsWith('.web.app')){
    location.replace('https://' + CASA + location.pathname.replace(/^\/Calendario-de-pagos/, '') + location.search + location.hash);
  }
})();
(function(){
  "use strict";
  const PERMITIDOS = [
    "nemecioagg@gmail.com",
    "mffpb09@hotmail.com",
    "mffpb09@gmail.com",
  ];
  const EMAIL_KEY = 'acceso-email-para-enlace';

  const css = `
  .acceso-backdrop{ position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:16px;
    background:var(--paper,#F2F4EE); color:var(--ink,#1C2621); font-family:var(--font-body,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif); }
  .acceso-backdrop[hidden]{ display:none; }
  .acceso-card{ width:100%; max-width:380px; background:var(--surface,#fff); border:1px solid var(--border,#E1E5D6); border-radius:22px;
    padding:26px 22px; text-align:center; box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 22px rgba(0,0,0,.07); }
  .acceso-card h2{ font-family:var(--font-display,Georgia,serif); font-weight:600; font-size:22px; margin:0 0 8px; }
  .acceso-card p{ margin:0 0 18px; font-size:14px; color:var(--ink-soft,#5B6660); }
  .acceso-btn{ font:600 15px var(--font-body,sans-serif); padding:11px 20px; border-radius:999px; border:1px solid var(--border,#E1E5D6);
    background:var(--surface-2,#F1F3EC); color:var(--ink,#1C2621); cursor:pointer; }
  .acceso-o{ margin:16px 0 10px; font-size:12.5px; color:var(--ink-faint,#8B958E); }
  .acceso-form{ display:flex; gap:8px; }
  .acceso-form input{ flex:1; min-width:0; font:15px var(--font-body,sans-serif); padding:10px 12px; border-radius:12px;
    border:1px solid var(--border,#E1E5D6); background:var(--surface-2,#F1F3EC); color:var(--ink,#1C2621); }
  .acceso-msg{ margin-top:14px !important; min-height:1em; font-size:13px !important; }
  .acceso-salir{ position:fixed; bottom:10px; left:12px; z-index:40; font:500 12px var(--font-body,sans-serif); background:none; border:none;
    color:var(--ink-faint,#8B958E); text-decoration:underline; cursor:pointer; }
  .menu .acceso-salir{ position:static; padding:7px 4px 7px 8px; }
  .acceso-salir[hidden]{ display:none; }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const gate = document.createElement('div');
  gate.className = 'acceso-backdrop';
  gate.hidden = true;
  gate.innerHTML = `<div class="acceso-card">
      <h2>Entra para ver tus cuentas</h2>
      <p>Son privadas: solo Nemecio y María Fernanda pueden verlas.</p>
      <button type="button" class="acceso-btn" id="accesoEntrar">Entrar con Google</button>
      <div class="acceso-o">o recibe un enlace en tu correo</div>
      <form id="accesoForm" class="acceso-form">
        <input type="email" id="accesoEmail" required placeholder="tu correo" autocomplete="email">
        <button type="submit" class="acceso-btn">Enviar enlace</button>
      </form>
      <p class="acceso-msg" id="accesoMsg"></p>
    </div>`;
  const salir = document.createElement('button');
  salir.type = 'button';
  salir.className = 'acceso-salir';
  salir.textContent = 'Salir';
  salir.hidden = true;

  function mount(){
    document.body.appendChild(gate);
    document.body.appendChild(salir);
  }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  function setMsg(t){ const el = document.getElementById('accesoMsg'); if(el) el.textContent = t || ''; }

  function permitido(user){
    return !!user && user.emailVerified && PERMITIDOS.includes(String(user.email||'').toLowerCase());
  }

  // Llama a onReady una sola vez, cuando entra un correo permitido.
  window.requireAccess = function(onReady){
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    let started = false;

    gate.addEventListener('click', async (e)=>{
      if(e.target.id !== 'accesoEntrar') return;
      setMsg('Abriendo Google…');
      try{
        await auth.signInWithPopup(provider);
      }catch(err){
        const code = err && err.code || '';
        if(code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment'){
          auth.signInWithRedirect(provider);
        } else if(code === 'auth/unauthorized-domain'){
          setMsg('Esta dirección todavía no está autorizada en Firebase.');
        } else if(code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request'){
          setMsg('No se pudo entrar con Google. Prueba con "recibe un enlace en tu correo".');
        } else {
          setMsg('');
        }
      }
    });
    gate.addEventListener('submit', async (e)=>{
      if(e.target.id !== 'accesoForm') return;
      e.preventDefault();
      const email = document.getElementById('accesoEmail').value.trim().toLowerCase();
      if(!PERMITIDOS.includes(email)){ setMsg('Ese correo no tiene acceso.'); return; }
      setMsg('Enviando…');
      try{
        await auth.sendSignInLinkToEmail(email, {url: location.href.split('#')[0].split('?')[0], handleCodeInApp:true});
        try{ localStorage.setItem(EMAIL_KEY, email); }catch(_){}
        setMsg('Listo. Abre el enlace que te llegó a ' + email + ' (revisa también correo no deseado).');
      }catch(err){
        setMsg(err && err.code === 'auth/unauthorized-continue-uri'
          ? 'Esta dirección todavía no está autorizada en Firebase.'
          : 'No se pudo enviar el enlace. Intenta de nuevo.');
      }
    });

    if(auth.isSignInWithEmailLink(location.href)){
      let email = null;
      try{ email = localStorage.getItem(EMAIL_KEY); }catch(_){}
      if(!email) email = (prompt('Confirma tu correo para entrar') || '').trim().toLowerCase();
      if(email){
        auth.signInWithEmailLink(email, location.href)
          .then(()=>{
            try{ localStorage.removeItem(EMAIL_KEY); }catch(_){}
            history.replaceState(null, '', location.pathname);
          })
          .catch(()=> setMsg('El enlace ya no sirve. Pide uno nuevo.'));
      }
    }

    salir.addEventListener('click', ()=>{ auth.signOut().then(()=> location.reload()); });

    // Si la vuelta de Google falla (pasa en algunos teléfonos), se explica qué hacer en vez de dejar la pantalla en blanco.
    auth.getRedirectResult().catch(()=> setMsg('No se pudo terminar de entrar con Google. Intenta otra vez, o usa "recibe un enlace en tu correo".'));
    auth.onAuthStateChanged(user=>{
      if(permitido(user)){
        gate.hidden = true;
        salir.hidden = false;
        const menu = document.querySelector('.menu');
        if(menu && salir.parentNode !== menu) menu.appendChild(salir);
        if(!started){ started = true; onReady(user); }
        return;
      }
      if(started){ location.reload(); return; }
      salir.hidden = true;
      gate.hidden = false;
      if(user){
        setMsg('La cuenta ' + user.email + ' no tiene acceso.');
        auth.signOut();
      }
    });
  };
})();
