import {describe,it,expect} from 'vitest';
import {approvedSimulationPayment} from '../../scripts/fixtures/approved-v394-payment';
import {quotePaymentSchedule} from './quotePaymentSchedule';

describe('Approved V1.5 simulation schedules',()=>{
 it.each([
  ['AW-WEB-VITRINE',[40,60],'OFF-007',false],
  ['AW-ECOM-BASE',[30,40,30],'OFF-007',false],
  ['V39-ECOM-BUSINESS',[30,40,30],'OFF-007',false],
  ['V39-ECOM-VISIBILITE',[30,40,30],'OFF-007',false],
  ['V39-NL-PONCT-SIMPLE',[100],'SQ-24',false],
  ['AW-MARIAGE-HISTOIRE',[40,60],'SQ-24',true],
 ] as const)('%s follows its source rule',(code,percentages,reference,unresolved)=>{
  const result=approvedSimulationPayment(code,'professional');
  expect(result.parameters.payment.milestones.map(m=>m.percent)).toEqual(percentages);
  expect(result.reference).toBe(reference);expect(result.unresolved).toBe(unresolved);
  const rows=quotePaymentSchedule(result.parameters,[],69901);
  expect(rows.reduce((n,m)=>n+m.amountCents,0)).toBe(69901);
  expect(rows.every(m=>Number.isSafeInteger(m.amountCents))).toBe(true);
 });
 it.each(['AW-MAINT-WP-M','AW-MAINT-WP-A','AW-MAINT-WC-M','AW-MAINT-WC-A','V39-HOST-LUNE','V39-GBP-ESS-A','V39-STAT-ESS-M','V39-NL-1-A'])('%s does not invent an order deposit or payment date',code=>{
  const result=approvedSimulationPayment(code,'consumer');
  expect(result.unresolved).toBe(true);
  expect(result.parameters.payment.preset).toBe('custom');
  expect(result.parameters.payment.milestones).toHaveLength(1);
  expect(result.parameters.payment.milestones[0].dueDate).toBeNull();
  expect(result.parameters.payment.milestones[0].event).toContain('convenir');
  expect(result.parameters.payment.milestones[0].label).toContain('aucun acompte');
 });
});
