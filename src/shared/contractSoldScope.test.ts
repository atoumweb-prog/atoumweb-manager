import { describe, expect, it } from 'vitest';
import { formatSoldScope } from './contractSoldScope';

describe('Périmètre contractuel vendu', () => {
  it('affiche une seule fois les inclusions déjà reprises dans le périmètre personnalisé', () => {
    const inclusions=[
      'Hébergement offert 1 an',
      'Nom de domaine offert 1 an',
      'Jusqu’à 10 produits simples inclus',
    ];
    const scope=formatSoldScope({
      label:'E-commerce',quantityMilli:1000,inclusions,
      scope:inclusions.join('\n'),
      exclusions:['Maintenance non comprise'],
    });
    for(const item of inclusions)expect(scope.split(item)).toHaveLength(2);
    expect(scope).toContain('• Non inclus : Maintenance non comprise');
    expect(scope).not.toContain('Périmètre particulier convenu');
  });

  it('préserve chaque complément négocié absent du Catalogue, sans doublonner les exclusions',()=>{
    const result=formatSoldScope({
      label:'Site vitrine',quantityMilli:1000,
      inclusions:['Cinq pages', 'Hébergement offert 1 an'],
      scope:'Cinq pages\nPages à créer : Accueil, Services, À propos, Réalisations, Contact',
      exclusions:['Photographie', 'Photographie'],
    });
    expect(result).toContain('• Inclus : Cinq pages');
    expect(result).toContain('• Périmètre particulier convenu : Pages à créer : Accueil, Services, À propos, Réalisations, Contact');
    expect(result.split('Cinq pages')).toHaveLength(2);
    expect(result.split('• Non inclus : Photographie')).toHaveLength(2);
  });

  it('ne transforme pas un champ de périmètre manquant en engagement inventé',()=>{
    const result=formatSoldScope({label:'Mariage Essentiel',quantityMilli:1000,inclusions:['Site de mariage'],scope:null});
    expect(result).toContain('• Inclus : Site de mariage');
    expect(result).not.toContain('Date de mise en ligne');
    expect(result).not.toContain('Durée de disponibilité');
  });
});
