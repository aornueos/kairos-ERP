/**
 * Catálogo inicial da Pure.us, transcrito da planilha de pedido usada pelo
 * comercial antes do KAIROS.
 *
 * Correções feitas na transcrição, a confirmar com a Pure.us:
 *   - produto 482: o DUN-14 veio como "c"; fica em branco e o sistema o deriva do
 *     EAN (17898649053798), pela mesma regra de todos os outros produtos;
 *   - "Powe Dose" (481 e 486) grafado como "Power Dose", igual ao 476;
 *   - "Leavei-in" (485) grafado como "Leave-in", igual ao 480.
 *
 * Preços são os da planilha (R$ 6,50 em todos). Ajuste pela tela de produtos.
 */

export interface ProdutoCatalogo {
  codigo: string
  nome: string
  ean: string
  dun14: string | null
  ncm: string
  cest: string
  cstCsosn: string
  /** Comprimento x largura x altura, em centímetros. */
  dimensoes: [string, string, string]
  preco: string
  caixaMaster: number
}

export interface LinhaCatalogo {
  nome: string
  apelo: string
  cor: string
  produtos: ProdutoCatalogo[]
}

const SHAMPOO = { ncm: '33051000', cest: '2801100' }
const CAPILAR = { ncm: '33059000', cest: '2801300' }
const PADRAO = { cstCsosn: '101', preco: '6.50', caixaMaster: 144 }

export const CATALOGO_PUREUS: LinhaCatalogo[] = [
  {
    nome: 'Brilho Supremo',
    apelo: 'Anti Frizz',
    cor: '#D9D9D9',
    produtos: [
      {
        codigo: '482',
        nome: 'Shampoo Anti Frizz 100ml',
        ean: '7898649053791',
        dun14: null,
        ...SHAMPOO,
        ...PADRAO,
        dimensoes: ['4.5', '4.5', '11'],
      },
      {
        codigo: '483',
        nome: 'Condicionador Anti Frizz 100ml',
        ean: '7898649053807',
        dun14: '17898649053804',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['6', '4', '14.5'],
      },
      {
        codigo: '484',
        nome: 'Máscara Anti Frizz 100gr',
        ean: '7898649053814',
        dun14: '17898649053811',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['7', '7', '5'],
      },
      {
        codigo: '485',
        nome: 'Leave-in Anti Frizz 100ml',
        ean: '7898649053821',
        dun14: '17898649053828',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['4', '4', '16.5'],
      },
      {
        codigo: '486',
        nome: 'Power Dose 13ml',
        ean: '7898649054064',
        dun14: '17898649054061',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['2.5', '2.5', '6'],
      },
    ],
  },
  {
    nome: 'Renova',
    apelo: 'Reconstrução',
    cor: '#F6CFEA',
    produtos: [
      {
        codigo: '477',
        nome: 'Shampoo Reconstrutor 100ml',
        ean: '7898649053838',
        dun14: '17898649053835',
        ...SHAMPOO,
        ...PADRAO,
        dimensoes: ['4.5', '4.5', '11'],
      },
      {
        codigo: '478',
        nome: 'Condicionador Reconstrutor 100ml',
        ean: '7898649053852',
        dun14: '17898649053859',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['6', '4', '14.5'],
      },
      {
        codigo: '479',
        nome: 'Máscara Reconstrutora 100gr',
        ean: '7898649053845',
        dun14: '17898649053842',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['7', '7', '5'],
      },
      {
        codigo: '480',
        nome: 'Leave-in Reconstrutor 100ml',
        ean: '7898649053869',
        dun14: '17898649053866',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['4', '4', '16.5'],
      },
      {
        codigo: '481',
        nome: 'Power Dose 13ml',
        ean: '7898649054057',
        dun14: '17898649054054',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['2.5', '2.5', '6'],
      },
    ],
  },
  {
    nome: 'Cachos e Ondulados',
    apelo: 'Cabelos Cacheados',
    cor: '#C6E0B4',
    produtos: [
      {
        codigo: '472',
        nome: 'Shampoo Hidratante 100ml',
        ean: '7898649053876',
        dun14: '17898649053873',
        ...SHAMPOO,
        ...PADRAO,
        dimensoes: ['4.5', '4.5', '11'],
      },
      {
        codigo: '473',
        nome: 'Condicionador Hidratante 100ml',
        ean: '7898649053883',
        dun14: '17898649053880',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['6', '4', '14.5'],
      },
      {
        codigo: '474',
        nome: 'Máscara Hidratante 100gr',
        ean: '7898649053890',
        dun14: '17898649053897',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['7', '7', '5'],
      },
      {
        codigo: '475',
        nome: 'Ativador de Cachos 100ml',
        ean: '7898649053906',
        dun14: '17898649053903',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['4', '4', '16.5'],
      },
      {
        codigo: '476',
        nome: 'Power Dose 13ml',
        ean: '7898649054040',
        dun14: '17898649054047',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['2.5', '2.5', '6'],
      },
    ],
  },
  {
    nome: 'Sérum',
    apelo: 'Reparador de Pontas',
    cor: '#F8CBAD',
    produtos: [
      {
        codigo: '500',
        nome: 'Sérum Reparador de Pontas Peptídeos',
        ean: '7898649054071',
        dun14: '17898649054078',
        ...CAPILAR,
        ...PADRAO,
        dimensoes: ['3', '3', '9'],
      },
    ],
  },
]
