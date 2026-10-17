// Reglas de fechas de los pagos: cuándo toca cada uno, la próxima nómina y el
// estado ("Hoy", "Venció hace 3 días"…). Las usan las páginas (window.Fechas) y el
// programa de avisos diarios (scripts/avisos.mjs), para que calculen exactamente igual.
(function(raiz, hacer){
  if(typeof module === 'object' && module.exports) module.exports = hacer();
  else raiz.Fechas = hacer();
})(this, function(){
  "use strict";
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


  return {parseISO, toISO, cmp, daysInMonth, addDays, todayObj, monthAbs, occurrenceAtMonth, diffDays, weekdayMon,
    nextDue, prevOccurrence, nextPayday, statusForDue};
});
