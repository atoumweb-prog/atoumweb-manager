export const HOME_WIDGET_PREFERENCE_KEY='atoumweb:home:widgets:v1';
export const HOME_WIDGET_KEYS=['today','kpis','pipeline','time','watch','actions'] as const;
export type HomeWidgetKey=typeof HOME_WIDGET_KEYS[number];
export type HomeWidgetPreference={version:1;order:HomeWidgetKey[];hidden:HomeWidgetKey[]};
export const defaultHomeWidgets=():HomeWidgetPreference=>({version:1,order:[...HOME_WIDGET_KEYS],hidden:[]});
const known=(value:unknown):value is HomeWidgetKey=>typeof value==='string'&&(HOME_WIDGET_KEYS as readonly string[]).includes(value);
export function normalizeHomeWidgets(raw:unknown):HomeWidgetPreference{
 if(!raw||typeof raw!=='object'||(raw as {version:unknown}).version!==1)throw Error('Disposition Accueil incompatible.');
 const input=raw as {order?:unknown;hidden?:unknown};
 const order=[...new Set((Array.isArray(input.order)?input.order:[]).filter(known))];
 return{version:1,order:['today',...order.filter(key=>key!=='today'),...HOME_WIDGET_KEYS.filter(key=>key!=='today'&&!order.includes(key))],hidden:[...new Set((Array.isArray(input.hidden)?input.hidden:[]).filter(known))].filter(key=>key!=='today')};
}
export function moveHomeWidget(preference:HomeWidgetPreference,key:HomeWidgetKey,delta:-1|1){
 const order=[...preference.order],from=order.indexOf(key),to=from+delta;
 if(key==='today'||from<1||to<1||to>=order.length)return preference;
 [order[from],order[to]]=[order[to],order[from]];return{...preference,order};
}
export function dropHomeWidget(preference:HomeWidgetPreference,key:HomeWidgetKey,target:HomeWidgetKey){
 if(key==='today'||target==='today'||key===target)return preference;
 const order=preference.order.filter(value=>value!==key);order.splice(order.indexOf(target),0,key);return{...preference,order};
}
