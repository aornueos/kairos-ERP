/**
 * Dados de referência obrigatórios em todo ambiente.
 *
 * As listas completas de municípios (5.570) e NCM vêm de CSV versionado na
 * fase 1. Aqui ficam as capitais e os códigos que a Pure.us usa de fato, o
 * suficiente para operar e para os testes.
 */

export const UFS = [
  { sigla: 'AC', nome: 'Acre', codigoIbge: '12', regiao: 'Norte' },
  { sigla: 'AL', nome: 'Alagoas', codigoIbge: '27', regiao: 'Nordeste' },
  { sigla: 'AP', nome: 'Amapá', codigoIbge: '16', regiao: 'Norte' },
  { sigla: 'AM', nome: 'Amazonas', codigoIbge: '13', regiao: 'Norte' },
  { sigla: 'BA', nome: 'Bahia', codigoIbge: '29', regiao: 'Nordeste' },
  { sigla: 'CE', nome: 'Ceará', codigoIbge: '23', regiao: 'Nordeste' },
  { sigla: 'DF', nome: 'Distrito Federal', codigoIbge: '53', regiao: 'Centro-Oeste' },
  { sigla: 'ES', nome: 'Espírito Santo', codigoIbge: '32', regiao: 'Sudeste' },
  { sigla: 'GO', nome: 'Goiás', codigoIbge: '52', regiao: 'Centro-Oeste' },
  { sigla: 'MA', nome: 'Maranhão', codigoIbge: '21', regiao: 'Nordeste' },
  { sigla: 'MT', nome: 'Mato Grosso', codigoIbge: '51', regiao: 'Centro-Oeste' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', codigoIbge: '50', regiao: 'Centro-Oeste' },
  { sigla: 'MG', nome: 'Minas Gerais', codigoIbge: '31', regiao: 'Sudeste' },
  { sigla: 'PA', nome: 'Pará', codigoIbge: '15', regiao: 'Norte' },
  { sigla: 'PB', nome: 'Paraíba', codigoIbge: '25', regiao: 'Nordeste' },
  { sigla: 'PR', nome: 'Paraná', codigoIbge: '41', regiao: 'Sul' },
  { sigla: 'PE', nome: 'Pernambuco', codigoIbge: '26', regiao: 'Nordeste' },
  { sigla: 'PI', nome: 'Piauí', codigoIbge: '22', regiao: 'Nordeste' },
  { sigla: 'RJ', nome: 'Rio de Janeiro', codigoIbge: '33', regiao: 'Sudeste' },
  { sigla: 'RN', nome: 'Rio Grande do Norte', codigoIbge: '24', regiao: 'Nordeste' },
  { sigla: 'RS', nome: 'Rio Grande do Sul', codigoIbge: '43', regiao: 'Sul' },
  { sigla: 'RO', nome: 'Rondônia', codigoIbge: '11', regiao: 'Norte' },
  { sigla: 'RR', nome: 'Roraima', codigoIbge: '14', regiao: 'Norte' },
  { sigla: 'SC', nome: 'Santa Catarina', codigoIbge: '42', regiao: 'Sul' },
  { sigla: 'SP', nome: 'São Paulo', codigoIbge: '35', regiao: 'Sudeste' },
  { sigla: 'SE', nome: 'Sergipe', codigoIbge: '28', regiao: 'Nordeste' },
  { sigla: 'TO', nome: 'Tocantins', codigoIbge: '17', regiao: 'Norte' },
] as const

export const MUNICIPIOS = [
  { codigoIbge: '3550308', nome: 'São Paulo', ufSigla: 'SP', capital: true },
  { codigoIbge: '3304557', nome: 'Rio de Janeiro', ufSigla: 'RJ', capital: true },
  { codigoIbge: '3106200', nome: 'Belo Horizonte', ufSigla: 'MG', capital: true },
  { codigoIbge: '4106902', nome: 'Curitiba', ufSigla: 'PR', capital: true },
  { codigoIbge: '4314902', nome: 'Porto Alegre', ufSigla: 'RS', capital: true },
  { codigoIbge: '4205407', nome: 'Florianópolis', ufSigla: 'SC', capital: true },
  { codigoIbge: '2927408', nome: 'Salvador', ufSigla: 'BA', capital: true },
  { codigoIbge: '2611606', nome: 'Recife', ufSigla: 'PE', capital: true },
  { codigoIbge: '2304400', nome: 'Fortaleza', ufSigla: 'CE', capital: true },
  { codigoIbge: '5300108', nome: 'Brasília', ufSigla: 'DF', capital: true },
  { codigoIbge: '5208707', nome: 'Goiânia', ufSigla: 'GO', capital: true },
  { codigoIbge: '3518800', nome: 'Guarulhos', ufSigla: 'SP', capital: false },
  { codigoIbge: '3509502', nome: 'Campinas', ufSigla: 'SP', capital: false },
] as const

/** Preparações capilares e o que a Pure.us compra como insumo e embalagem. */
export const NCMS = [
  { codigo: '33051000', descricao: 'Xampus', vigenciaInicio: '2022-04-01' },
  {
    codigo: '33052000',
    descricao: 'Preparações para ondulação ou alisamento permanentes dos cabelos',
    vigenciaInicio: '2022-04-01',
  },
  { codigo: '33053000', descricao: 'Laquês para o cabelo', vigenciaInicio: '2022-04-01' },
  {
    codigo: '33059000',
    descricao: 'Outras preparações capilares',
    vigenciaInicio: '2022-04-01',
  },
  {
    codigo: '33049910',
    descricao: 'Cremes de beleza e cremes nutritivos; loções tônicas',
    vigenciaInicio: '2022-04-01',
  },
  {
    codigo: '34013000',
    descricao: 'Produtos e preparações orgânicos tensoativos para lavagem da pele',
    vigenciaInicio: '2022-04-01',
  },
  {
    codigo: '39235000',
    descricao: 'Rolhas, tampas, cápsulas e outros dispositivos para fechar recipientes',
    vigenciaInicio: '2022-04-01',
  },
  {
    codigo: '39233000',
    descricao: 'Garrafões, garrafas, frascos e artigos semelhantes, de plástico',
    vigenciaInicio: '2022-04-01',
  },
  {
    codigo: '48191000',
    descricao: 'Caixas de papel ou cartão ondulado',
    vigenciaInicio: '2022-04-01',
  },
  {
    codigo: '48211000',
    descricao: 'Etiquetas de papel ou cartão, impressas',
    vigenciaInicio: '2022-04-01',
  },
] as const

/** CFOPs do fluxo de uma indústria: entrada de insumo, venda e devolução. */
export const CFOPS = [
  { codigo: '1101', descricao: 'Compra para industrialização', tipo: 'ENTRADA' },
  {
    codigo: '2101',
    descricao: 'Compra para industrialização (outra UF)',
    tipo: 'ENTRADA',
  },
  { codigo: '1102', descricao: 'Compra para comercialização', tipo: 'ENTRADA' },
  {
    codigo: '2102',
    descricao: 'Compra para comercialização (outra UF)',
    tipo: 'ENTRADA',
  },
  {
    codigo: '1202',
    descricao: 'Devolução de venda de produção do estabelecimento',
    tipo: 'ENTRADA',
  },
  {
    codigo: '1403',
    descricao: 'Compra para comercialização com ICMS-ST',
    tipo: 'ENTRADA',
  },
  { codigo: '5101', descricao: 'Venda de produção do estabelecimento', tipo: 'SAIDA' },
  {
    codigo: '6101',
    descricao: 'Venda de produção do estabelecimento (outra UF)',
    tipo: 'SAIDA',
  },
  {
    codigo: '5102',
    descricao: 'Venda de mercadoria adquirida de terceiros',
    tipo: 'SAIDA',
  },
  {
    codigo: '6102',
    descricao: 'Venda de mercadoria adquirida de terceiros (outra UF)',
    tipo: 'SAIDA',
  },
  {
    codigo: '5401',
    descricao: 'Venda de produção do estabelecimento com ICMS-ST',
    tipo: 'SAIDA',
  },
  {
    codigo: '6401',
    descricao: 'Venda de produção com ICMS-ST (outra UF)',
    tipo: 'SAIDA',
  },
  {
    codigo: '5910',
    descricao: 'Remessa em bonificação, doação ou brinde',
    tipo: 'SAIDA',
  },
  { codigo: '5911', descricao: 'Remessa de amostra grátis', tipo: 'SAIDA' },
  {
    codigo: '5152',
    descricao: 'Transferência de mercadoria adquirida de terceiros',
    tipo: 'SAIDA',
  },
  {
    codigo: '5202',
    descricao: 'Devolução de compra para comercialização',
    tipo: 'SAIDA',
  },
] as const

export const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil', ispb: '00000000' },
  { codigo: '033', nome: 'Santander', ispb: '90400888' },
  { codigo: '077', nome: 'Banco Inter', ispb: '00416968' },
  { codigo: '104', nome: 'Caixa Econômica Federal', ispb: '00360305' },
  { codigo: '237', nome: 'Bradesco', ispb: '60746948' },
  { codigo: '260', nome: 'Nu Pagamentos', ispb: '18236120' },
  { codigo: '341', nome: 'Itaú Unibanco', ispb: '60701190' },
  { codigo: '336', nome: 'Banco C6', ispb: '31872495' },
  { codigo: '748', nome: 'Sicredi', ispb: '01181521' },
  { codigo: '756', nome: 'Sicoob', ispb: '02038232' },
] as const

export const UNIDADES = [
  { codigo: 'UN', descricao: 'Unidade', decimais: 0 },
  { codigo: 'CX', descricao: 'Caixa', decimais: 0 },
  { codigo: 'FD', descricao: 'Fardo', decimais: 0 },
  { codigo: 'KG', descricao: 'Quilograma', decimais: 4 },
  { codigo: 'G', descricao: 'Grama', decimais: 4 },
  { codigo: 'L', descricao: 'Litro', decimais: 4 },
  { codigo: 'ML', descricao: 'Mililitro', decimais: 4 },
  { codigo: 'PC', descricao: 'Peça', decimais: 0 },
  { codigo: 'MIL', descricao: 'Milheiro', decimais: 3 },
] as const
