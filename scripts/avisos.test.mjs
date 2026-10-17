// Pruebas de lo que decide el aviso diario (corren antes de mandar nada).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lineasDelDia, hoyEnMadero} from './avisos.mjs';

const hoy = {y:2026, m:9, d:16}; // 16 oct 2026

test('pagos de hoy, mañana y vencidos', ()=>{
  const payments = [
    {id:'a', name:'Renta', amount:9500, recurrenceType:'monthly', monthsInterval:1, day:16, anchorDate:'2020-01-01', lastPaidDate:'2026-09-16'},
    {id:'b', name:'Netflix', amount:299, recurrenceType:'monthly', monthsInterval:1, day:17, anchorDate:'2020-01-01', lastPaidDate:'2026-09-17'},
    {id:'c', name:'Gas', amount:560, recurrenceType:'monthly', monthsInterval:1, day:10, anchorDate:'2020-01-01', lastPaidDate:'2026-09-10'},
    {id:'d', name:'Luz', amount:900, recurrenceType:'monthly', monthsInterval:1, day:25, anchorDate:'2020-01-01', lastPaidDate:'2026-09-25'},
    {id:'e', name:'Tenencia', amount:3200, recurrenceType:'one_time', anchorDate:'2026-10-16', lastPaidDate:'2026-10-16'},
  ];
  assert.deepEqual(lineasDelDia({payments}, hoy), ['Hoy: 💸 Renta $9,500', 'Pronto: 💸 Netflix $299', 'Vencidos: Gas $560']);
});

test('cumpleaños cada año y citas solo si siguen abiertas', ()=>{
  const notes = [
    {tipo:'cumple', fecha:'1962-10-17', text:'Cumple de mamá', status:'done'},
    {tipo:'cita', fecha:'2026-10-16', text:'Dentista', status:'open'},
    {tipo:'cita', fecha:'2026-10-16', text:'Ya fue', status:'done'},
    {text:'Súper 850', status:'open'},
  ];
  assert.deepEqual(lineasDelDia({notes}, hoy), ['Hoy: 📌 Dentista', 'Pronto: 🎂 Cumple de mamá']);
});

test('documentos que vencen pronto', ()=>{
  const documents = [{name:'Seguro', vence:'2026-10-23'}, {name:'Contrato', vence:'2026-12-01'}, {name:'Póliza', vence:'2026-10-16'}];
  assert.deepEqual(lineasDelDia({documents}, hoy), ['Hoy: 📄 Vence hoy: Póliza', 'Pronto: 📄 Seguro vence en 7 días']);
});

test('nada que avisar', ()=>{ assert.deepEqual(lineasDelDia({}, hoy), []); });

test('la fecha de Ciudad Madero', ()=>{
  // 16 oct 2026 a las 04:00 UTC todavía es 15 oct en Madero (UTC-6).
  assert.deepEqual(hoyEnMadero(new Date('2026-10-16T04:00:00Z')), {y:2026, m:9, d:15});
});
