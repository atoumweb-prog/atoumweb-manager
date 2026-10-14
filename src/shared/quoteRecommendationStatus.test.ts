import {describe,expect,it} from 'vitest';
import type {CatalogRecommendationLink,QuoteLine} from './commercial';
import {quoteRecommendationState,QUOTE_RECOMMENDATION_STATE_LABELS} from './quoteRecommendationStatus';

const quoteLine=(id:string,props:Partial<QuoteLine>={}):QuoteLine=>({
  id,quoteId:'quote-1',source:'catalog',label:'Line '+id,sortOrder:0,
  adjustmentMode:'none',catalogLineValueCents:0,contractLineValueCents:0,
  createdAt:'2026-10-14',updatedAt:'2026-10-14',...props,
});
const target=(props:Partial<CatalogRecommendationLink>={}):CatalogRecommendationLink=>({
  id:'link',sourceVersionId:'offer-v1',targetVersionId:'service-v1',
  targetItemId:'service',targetName:'Service',targetVersionNumber:1,
  targetVersionStatus:'published',targetItemStatus:'active',sortOrder:0,...props,
});
describe('04D — états du conseil commercial dans une ligne de Devis',()=>{
  const source=quoteLine('offer',{catalogItemId:'offer',catalogVersionId:'offer-v1',
    snapshot:{itemType:'offer',offerComponents:[]}});
  it('starts recommended, never purchased or included by implication',()=>{
    expect(quoteRecommendationState(source,target(),[source])).toBe('recommended');
    expect(QUOTE_RECOMMENDATION_STATE_LABELS.recommended).toContain('non ajouté');
  });
  it('detects mandatory inclusion independently of an extra quote line',()=>{
    const offer=quoteLine('offer',{snapshot:{offerComponents:[{
      serviceItemId:'service',componentId:'component-1',isOptional:false,
    }]}});
    expect(quoteRecommendationState(offer,target(),[offer])).toBe('included');
  });
  it('distinguishes an available option from the option purchased with explicit origin',()=>{
    const offer=quoteLine('offer',{catalogVersionId:'offer-v1',snapshot:{offerComponents:[{
      serviceItemId:'service',componentId:'component-1',isOptional:true,
    }]}});
    expect(quoteRecommendationState(offer,target(),[offer])).toBe('option-available');
    const bought=quoteLine('option',{catalogItemId:'service',
      optionPurchase:{state:'purchased',sourceOfferLineId:'offer',
        sourceOfferItemId:'offer-item',sourceOfferVersionId:'offer-v1',
        sourceComponentId:'component-1',purchasedAt:'2026-10-14'},
    });
    expect(quoteRecommendationState(offer,target(),[offer,bought])).toBe('option-purchased');
  });
  it('does not offer to purchase an optional service already added elsewhere on the Quote',()=>{
    const offer=quoteLine('offer',{catalogVersionId:'offer-v1',snapshot:{offerComponents:[{
      serviceItemId:'service',componentId:'optional-1',isOptional:true,
    }]}});
    const independentlyAdded=quoteLine('service-line',{
      catalogItemId:'service',catalogVersionId:'service-v2',
    });
    expect(quoteRecommendationState(offer,target(),[offer,independentlyAdded]))
      .toBe('already-added');
    // Purchasing the precise option still takes precedence for its source offer.
    const option=quoteLine('option',{catalogItemId:'service',optionPurchase:{
      state:'purchased',sourceOfferLineId:'offer',sourceOfferItemId:'offer-item',
      sourceOfferVersionId:'offer-v1',sourceComponentId:'optional-1',purchasedAt:'2026-10-14',
    }});
    expect(quoteRecommendationState(offer,target(),[offer,independentlyAdded,option]))
      .toBe('option-purchased');
  });
  it('detects already added service by item, including another version or a historical snapshot',()=>{
    const other=quoteLine('line',{catalogItemId:'service',catalogVersionId:'service-v2'});
    expect(quoteRecommendationState(source,target(),[source,other])).toBe('already-added');
    expect(quoteRecommendationState(source,target(),[source,quoteLine('historical',{
      catalogItemId:null,snapshot:{itemId:'service',versionId:'service-old'},
    })])).toBe('already-added');
  });
  it('keeps retired and inactive recommendations visible but unavailable for purchase',()=>{
    expect(quoteRecommendationState(source,target({targetVersionStatus:'retired'}),[source]))
      .toBe('unavailable');
    expect(quoteRecommendationState(source,target({targetItemStatus:'archived'}),[source]))
      .toBe('unavailable');
    expect(quoteRecommendationState(source,target({targetVersionStatus:'draft'}),[source]))
      .toBe('unavailable');
  });
  it('does not mistake a pending or unrelated service line for a purchased option',()=>{
    const offer=quoteLine('offer',{snapshot:{offerComponents:[{
      serviceItemId:'service',componentId:'component-1',isOptional:true,
    }]}});
    const origin={sourceOfferLineId:'offer',sourceOfferItemId:'offer-item',
      sourceOfferVersionId:'offer-v1',sourceComponentId:'component-1',purchasedAt:'2026-10-14'};
    const otherService=quoteLine('other-service',{catalogItemId:'another-service',
      optionPurchase:{...origin,state:'purchased'}});
    expect(quoteRecommendationState(offer,target(),[offer,otherService])).toBe('option-available');
    const pending=quoteLine('pending',{catalogItemId:'service',
      optionPurchase:{...origin,state:'available' as 'purchased'}});
    expect(quoteRecommendationState(offer,target(),[offer,pending])).toBe('already-added');
  });
  it('does not transfer a purchased option to another version of the same offer line',()=>{
    const offer=quoteLine('offer',{catalogVersionId:'offer-v2',snapshot:{offerComponents:[{
      serviceItemId:'service',componentId:'component-1',isOptional:true,
    }]}});
    const oldPurchase=quoteLine('option',{catalogItemId:'service',optionPurchase:{
      state:'purchased',sourceOfferLineId:'offer',sourceOfferItemId:'offer-item',
      sourceOfferVersionId:'offer-v1',sourceComponentId:'component-1',purchasedAt:'2026-10-14',
    }});
    expect(quoteRecommendationState(offer,target(),[offer,oldPurchase])).toBe('already-added');
    const currentPurchase=quoteLine('option-current',{catalogItemId:'service',optionPurchase:{
      ...oldPurchase.optionPurchase!,sourceOfferVersionId:'offer-v2',
    }});
    expect(quoteRecommendationState(offer,target(),[offer,currentPurchase])).toBe('option-purchased');
  });
  it('uses the preserved snapshot version when the historical offer line has no catalogVersionId',()=>{
    const offer=quoteLine('offer',{snapshot:{versionId:'offer-v2',offerComponents:[{
      serviceItemId:'service',componentId:'component-1',isOptional:true,
    }]}});
    const old=quoteLine('option-old',{catalogItemId:'service',optionPurchase:{
      state:'purchased',sourceOfferLineId:'offer',sourceOfferItemId:'offer-item',
      sourceOfferVersionId:'offer-v1',sourceComponentId:'component-1',purchasedAt:'2026-10-14',
    }});
    expect(quoteRecommendationState(offer,target(),[offer,old])).toBe('already-added');
    const current=quoteLine('option-current',{catalogItemId:'service',optionPurchase:{
      ...old.optionPurchase!,sourceOfferVersionId:'offer-v2',
    }});
    expect(quoteRecommendationState(offer,target(),[offer,current])).toBe('option-purchased');
  });
  it('never treats an unrelated option purchase as buying this recommendation',()=>{
    const offer=quoteLine('offer',{snapshot:{offerComponents:[{
      serviceItemId:'service',componentId:'component-1',isOptional:true,
    }]}});
    const unrelated=quoteLine('option',{optionPurchase:{
      state:'purchased',sourceOfferLineId:'another-offer',sourceOfferItemId:'elsewhere',
      sourceOfferVersionId:'other-v',sourceComponentId:'component-1',purchasedAt:'2026-10-14',
    }});
    expect(quoteRecommendationState(offer,target(),[offer,unrelated])).toBe('option-available');
  });
});