import {describe,it,expect} from 'vitest';
import type {QuoteDetail} from './commercial';
import type {MaintenanceSubscription} from './operations';
import {clientEngagements} from './clientEngagementPresentation';
const quote=(status='accepted')=>({id:'q',status,acceptedAt:'2026-11-05',lines:[{id:'base',label:'Base',contractLineValueCents:10000},{id:'addon',label:'Complément',contractLineValueCents:2000}]} as unknown as QuoteDetail);
const subscription={id:'s',planName:'Suivi',status:'active',startDate:'2026-11-10',endDate:null,frequency:'monthly',contractPriceCents:10000} as MaintenanceSubscription;
describe('Client engagements read-only projection',()=>{
 it('shows a shared subscription once and preserves both sold line sources without summing prices',()=>{const model=clientEngagements([quote()],[{subscription_id:'s',quote_line_id:'base',kind:'maintenance',policy_snapshot_json:'{"cadence":"monthly","billingPeriod":"yearly"}'},{subscription_id:'s',quote_line_id:'addon',kind:'recurring_addon'}],[subscription],[],[]);expect(model.rows).toHaveLength(1);expect(model.rows[0].sources).toHaveLength(2);expect(model.other).toHaveLength(0);expect(model.rows[0]).toMatchObject({amount:10000,cadence:'monthly',billing:'yearly',start:'2026-11-10',end:null});});
 it('does not turn accepted lines without objects into active services or invent dates from acceptance',()=>{const model=clientEngagements([quote()],[],[],[],[]);expect(model.rows).toHaveLength(0);expect(model.other).toHaveLength(2);expect(model.other[0].line.parameters?.serviceStartDate).toBeUndefined();});
 it('excludes nonaccepted proposals, preserves ended follows and manual subscriptions without claiming a quote origin',()=>{const model=clientEngagements([quote('draft')],[],[{...subscription,status:'ended',contractPriceCents:0}],[],[]);expect(model.other).toHaveLength(0);expect(model.rows[0]).toMatchObject({historical:true,amount:0,sources:[]});});
});

it('labels known plan units and multi-period billing without dividing the recorded amount',()=>{
 const manual=clientEngagements([],[],[subscription],[],[]).rows[0];expect(manual.amountLabel).toContain('mensuelle');
 const q=quote();q.lines[0].quantityMilli=2000;const row=clientEngagements([q],[{subscription_id:'s',quote_line_id:'base',kind:'maintenance',policy_snapshot_json:'{"cadence":"monthly","billingPeriod":"yearly","quantityMeaning":"billing_periods"}'}],[subscription],[],[]).rows[0];expect(row.amountLabel).toContain('2 période(s) annuelle');expect(row.amount).toBe(10000);
});
