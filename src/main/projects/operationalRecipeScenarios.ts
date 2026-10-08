import type {RecipeScenario} from '../../shared/operationalRecipe';
/** Explicit AW keys from the approved cases; no label inference. */
export const recipeScenarios: RecipeScenario[] = [
  {
    "id": "case-1",
    "name": "Vitrine seule",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-WEB-VITRINE",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-2",
    "name": "Landing seule",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-LP-BASE",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-3",
    "name": "WooCommerce seule",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-ECOM-BASE",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-4",
    "name": "Mariage Essentiel",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-MARIAGE-ESS",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-5",
    "name": "Mariage Grand Jour",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-MARIAGE-GRAND",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-6",
    "name": "Mariage Histoire — mini-site 4 Pages",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-MARIAGE-HISTOIRE",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-7",
    "name": "Vitrine + 2 Pages + Blog",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-WEB-VITRINE",
        "quantity": 1
      },
      {
        "key": "line-1",
        "code": "AW-WEB-PAGE-SUP",
        "quantity": 2
      },
      {
        "key": "line-2",
        "code": "AW-WEB-BLOG",
        "quantity": 1
      }
    ],
    "option": {
      "code": "AW-WEB-PAGE-SUP",
      "sourceLineKey": "line-0",
      "lineKey": "line-1",
      "selected": true,
      "quantity": 2
    }
  },
  {
    "id": "case-8",
    "name": "Landing + Section",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-LP-BASE",
        "quantity": 1
      },
      {
        "key": "line-1",
        "code": "AW-LP-SECTION",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-9",
    "name": "Woo + produit simple",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-ECOM-BASE",
        "quantity": 1
      },
      {
        "key": "line-1",
        "code": "AW-ECOM-PROD-SIMPLE",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-10",
    "name": "Woo + produit variable",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-ECOM-BASE",
        "quantity": 1
      },
      {
        "key": "line-1",
        "code": "AW-ECOM-PROD-VAR",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-11",
    "name": "Deux Vitrines + addon ciblé",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-WEB-VITRINE",
        "quantity": 1
      },
      {
        "key": "line-1",
        "code": "AW-WEB-VITRINE",
        "quantity": 1
      },
      {
        "key": "line-2",
        "code": "AW-WEB-PAGE-SUP",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-12",
    "name": "C seule Article SEO",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-CONT-ART-SEO",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-13",
    "name": "Cadrage WordPress — estimation incomplète",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-DEVWP-FONCTION",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-14",
    "name": "Option disponible non achetée",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-WEB-VITRINE",
        "quantity": 1
      }
    ],
    "option": {
      "code": "AW-WEB-PAGE-SUP",
      "sourceLineKey": "line-0",
      "lineKey": "option-page",
      "selected": false,
      "quantity": 1
    }
  },
  {
    "id": "case-15",
    "name": "C pack 4 articles SEO",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-CONT-PACK4-SEO",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-16",
    "name": "Application — estimation incomplète",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-APP-DEV",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-17",
    "name": "C Logo seul",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-BRAND-LOGO",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-18",
    "name": "C Audit SEO seul",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-SEO-AUDIT",
        "quantity": 1
      }
    ]
  },
  {
    "id": "case-19",
    "name": "SEO Performance — Site pending",
    "lines": [
      {
        "key": "line-0",
        "code": "AW-SEO-PERF",
        "quantity": 1
      }
    ]
  }
];
