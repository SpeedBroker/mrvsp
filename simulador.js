/**
 * ============================================================================
 * MÓDULO SPEEDSIM - SIMULADOR DE FINANCIAMENTO (MOTOR 100% INDEPENDENTE)
 * ============================================================================
 */

// =================================================
// 1. PARÂMETROS (Índices, Taxas e Tabelas)
// =================================================

const tabelaSubsidio = [
  { rendaMax: 1000.00, valor: 55000.00 },
  { rendaMax: 1200.00, valor: 55000.00 },
  { rendaMax: 1400.00, valor: 55000.00 },
  { rendaMax: 1600.00, valor: 55000.00 },
  { rendaMax: 1800.00, valor: 55000.00 },
  { rendaMax: 2000.00, valor: 50089.00 },
  { rendaMax: 2200.00, valor: 38993.00 },
  { rendaMax: 2400.00, valor: 29260.00 },
  { rendaMax: 2600.00, valor: 21157.00 },
  { rendaMax: 2800.00, valor: 14603.00 },
  { rendaMax: 3000.00, valor: 9621.00 },
  { rendaMax: 3200.00, valor: 5880.00 },
  { rendaMax: 3400.00, valor: 3492.00 },
  { rendaMax: 3600.00, valor: 2333.00 },
  { rendaMax: 3800.00, valor: 2142.00 },
  { rendaMax: 4000.00, valor: 2099.00 },
  { rendaMax: 4200.00, valor: 0.00 },
  { rendaMax: 4400.00, valor: 0.00 }
];

const tabelaCidades = [
  { municipio: "São Paulo", populacao: 11500000, teto: 275000 },
  { municipio: "Guarulhos", populacao: 1368784, teto: 275000 },
  { municipio: "Campinas", populacao: 1260000, teto: 275000 },
  { municipio: "Osasco", populacao: 766039, teto: 275000 },
  { municipio: "Jundiaí", populacao: 467978, teto: 235000 },
  { municipio: "Itaquaquecetuba", populacao: 389513, teto: 235000 },
  { municipio: "Suzano", populacao: 324911, teto: 235000 },
  { municipio: "Cotia", populacao: 294359, teto: 210000 },
  { municipio: "Vargem Grande Paulista", populacao: 53273, teto: 210000 }
];

const tabelaTaxasFaixas = [
  { limite: 2160, cotista: 0.0425, naoCotista: 0.0475, faixaNome: "Faixa 1" },
  { limite: 2850, cotista: 0.0450, naoCotista: 0.0500, faixaNome: "Faixa 1" },
  { limite: 3200, cotista: 0.0475, naoCotista: 0.0525, faixaNome: "Faixa 1" },
  { limite: 3500, cotista: 0.0500, naoCotista: 0.0550, faixaNome: "Faixa 2" },
  { limite: 4000, cotista: 0.0550, naoCotista: 0.0600, faixaNome: "Faixa 2" },
  { limite: 5000, cotista: 0.0650, naoCotista: 0.0700, faixaNome: "Faixa 2" },
  { limite: 9600, cotista: 0.0766, naoCotista: 0.0816, faixaNome: "Faixa 3" },
  { limite: 13000, cotista: 0.1000, naoCotista: 0.1000, faixaNome: "Faixa 4" }
];

const parametrosSAC = {
  aliquotaDFI: 0.00,
  valorManutencao: 0.00
};

const tabelaMIP_SAC = [
  { limite: 2850, MIP: 0.00052 },
  { limite: 4900, MIP: 0.00058 },
  { limite: 13000, MIP: 0.00069 }
];

function obterMIPSACPorRenda(renda) {
  const faixa = tabelaMIP_SAC.find(f => renda <= f.limite) || tabelaMIP_SAC[tabelaMIP_SAC.length - 1];
  return faixa ? faixa.MIP : 0.00052;
}

const parametrosPRICE = {
  aliquotaDFI: 0.00,
  valorManutencao: 0.00
};

const tabelaMIP_PRICE = [
  { limite: 2850, MIP: 0.0004 },
  { limite: 13000, MIP: 0.00048 }
];

function obterMIPPricePorRenda(renda) {
  const faixa = tabelaMIP_PRICE.find(f => renda <= f.limite) || tabelaMIP_PRICE[tabelaMIP_PRICE.length - 1];
  return faixa ? faixa.MIP : 0.0004;
}


// =================================================
// 2. MÁSCARAS E AUXILIARES
// =================================================

function inicializarMunicipios() {
  const selectMunicipio = document.getElementById("sim-cidade") || document.getElementById("cidade");
  if (!selectMunicipio) return;

  const valorSelecionadoAtual = selectMunicipio.value;
  selectMunicipio.innerHTML = '<option value="">Selecione...</option>';
  
  tabelaCidades.forEach(c => {
    let option = document.createElement("option");
    option.value = c.municipio;
    option.textContent = c.municipio;
    selectMunicipio.appendChild(option);
  });

  if (valorSelecionadoAtual) selectMunicipio.value = valorSelecionadoAtual;
}

function mascararMoeda(input) {
  let valor = input.value.replace(/\D/g, "");
  valor = (valor / 100).toFixed(2) + "";
  valor = valor.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  input.value = "R$ " + valor;
  atualizarTetoCidade();
}

function converterMoedaParaNumero(valorStr) {
  if (!valorStr) return 0;
  let limpo = valorStr.toString().replace("R$", "").trim().replaceAll(".", "").replace(",", ".");
  return parseFloat(limpo) || 0;
}

function formatarMoeda(num) {
  return "R$ " + (isNaN(num) ? 0 : num).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function atualizarTetoCidade() {
  const selectMunicipio = document.getElementById("sim-cidade") || document.getElementById("cidade");
  const cidadeImovel = selectMunicipio ? selectMunicipio.value : "";
  const dadosCidade = tabelaCidades.find(c => c.municipio === cidadeImovel);
  const tetoImovel = dadosCidade ? dadosCidade.teto : 275000;

  const inputTetoTela = document.getElementById("sim-teto") || document.getElementById("teto");
  if (inputTetoTela) inputTetoTela.value = formatarMoeda(tetoImovel);

  const inputImovel = document.getElementById("sim-val-imovel") || document.getElementById("sim-imovel") || document.getElementById("imovel");
  const inputStatus = document.getElementById("sim-status-teto") || document.getElementById("status-teto");
  
  if (inputImovel && inputStatus) {
    const valImovel = converterMoedaParaNumero(inputImovel.value);
    if (tetoImovel > 0 && valImovel > 0) {
      if (valImovel <= tetoImovel) {
        inputStatus.value = "DENTRO DO TETO";
        inputStatus.style.backgroundColor = "#e8f5e9";
        inputStatus.style.color = "#2e7d32";
      } else {
        inputStatus.value = "ACIMA DO TETO";
        inputStatus.style.backgroundColor = "#ffebee";
        inputStatus.style.color = "#c62828";
      }
    } else {
      inputStatus.value = "---";
    }
  }

  if (typeof simularFluxo === "function" && cidadeImovel !== "") {
    simularFluxo();
  }
}


// =================================================
// 3. FUNÇÕES DE CÁLCULO AUXILIARES
// =================================================

function calcularPrazoMaximoPorIdade() {
  const inputDataNasc = document.getElementById("sim-data-nasc") || document.getElementById("data-nasc");
  const inputPrazoMax = document.getElementById("sim-prazo-finan") || document.getElementById("prazo-finan");
  if (!inputDataNasc || !inputPrazoMax) return { prazoMaximoPermitido: 420, idade: 30 };

  const dataNascStr = inputDataNasc.value.trim();
  let idade = 30; 
  if (dataNascStr) {
    let anoNasc, mesNasc, diaNasc;
    if (dataNascStr.includes("/")) {
      const p = dataNascStr.split("/");
      diaNasc = parseInt(p[0]); mesNasc = parseInt(p[1]); anoNasc = parseInt(p[2]);
    } else if (dataNascStr.includes("-")) {
      const p = dataNascStr.split("-");
      if (p[0].length === 4) {
        anoNasc = parseInt(p[0]); mesNasc = parseInt(p[1]); diaNasc = parseInt(p[2]);
      } else {
        diaNasc = parseInt(p[0]); mesNasc = parseInt(p[1]); anoNasc = parseInt(p[2]);
      }
    }
    if (anoNasc && mesNasc && diaNasc) {
      const hoje = new Date();
      idade = hoje.getFullYear() - anoNasc;
      const m = (hoje.getMonth() + 1) - mesNasc;
      if (m < 0 || (m === 0 && hoje.getDate() < diaNasc)) idade--;
    }
  }

  const limiteMesesIdade = 966 - (idade * 12);
  const prazoMaximoPermitido = Math.min(Math.max(limiteMesesIdade, 0), 420);
  inputPrazoMax.value = prazoMaximoPermitido;
  inputPrazoMax.setAttribute("value", prazoMaximoPermitido);

  return { prazoMaximoPermitido, idade };
}

function obterTaxaAnualPROCX(valorImov, tetoImov, renda, redutor) {
  let faixaEncontrada;
  if (tetoImov > 0 && valorImov > tetoImov) {
    const subsetorAcimaTeto = tabelaTaxasFaixas.slice(6);
    faixaEncontrada = subsetorAcimaTeto.find(f => renda <= f.limite) || subsetorAcimaTeto[subsetorAcimaTeto.length - 1];
  } else {
    faixaEncontrada = tabelaTaxasFaixas.find(f => renda <= f.limite) || tabelaTaxasFaixas[tabelaTaxasFaixas.length - 1];
  }
  return (redutor.toLowerCase() === "sim" || redutor.toLowerCase() === "com redutor") ? faixaEncontrada.cotista : faixaEncontrada.naoCotista;
}

function calcularSubsidioMCMV(dados) {
    let { valorImovel, tetoMunicipio, maxParcelas, temCompradorOuDependente, rendaBruta } = dados;
    if (rendaBruta > 4400.00 || valorImovel > tetoMunicipio) return 0.00;

    let subsidioBase = 0.00;
    for (let i = 0; i < tabelaSubsidio.length; i++) {
        if (rendaBruta <= tabelaSubsidio[i].rendaMax) {
            subsidioBase = tabelaSubsidio[i].valor;
            break;
        }
    }

    if (!temCompradorOuDependente) subsidioBase *= 0.30;
    subsidioBase *= (maxParcelas / 420);
    return Math.max(0, parseFloat(subsidioBase.toFixed(2)));
}

function atualizarCamposTaxa(taxaAnual) {
  const taxaPercentual = (taxaAnual * 100).toFixed(2).replace('.', ',');
  const taxaFormatadaStr = `${taxaPercentual}% a.a.`;

  ['sim-taxa', 'taxa-juros', 'sim-taxa-juros', 'sac-taxa', 'price-taxa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
        el.value = taxaFormatadaStr;
      } else {
        el.innerText = taxaFormatadaStr;
      }
    }
  });
}

function atualizarCabecalhosDinamicos(valorImovel, finSac, finPrice, taxaAnual) {
  const pctSac = valorImovel > 0 ? (finSac / valorImovel) * 100 : 0;
  const pctPrice = valorImovel > 0 ? (finPrice / valorImovel) * 100 : 0;
  const taxaPercentual = (taxaAnual * 100).toFixed(2).replace('.', ',');

  const elSac = document.getElementById('sac-detalhe-titulo');
  if (elSac) {
    elSac.innerText = `(${pctSac.toFixed(1).replace('.', ',')}% a ${taxaPercentual}% a.a.)`;
  }

  const elPrice = document.getElementById('price-detalhe-titulo');
  if (elPrice) {
    elPrice.innerText = `(${pctPrice.toFixed(1).replace('.', ',')}% a ${taxaPercentual}% a.a.)`;
  }

  atualizarCamposTaxa(taxaAnual);
}


// =================================================
// 4. ATUALIZAÇÃO DOS CARDS (SAC / PRICE)
// =================================================

function atualizarCardFinanciamento(sistema, dados) {
  const {
    valorImovel, valorSubsidio, valorImovelLiquido, valorFinanciamentoCalculado,
    entradaTotalCalculada, valorFgts, valorBomPagador, entradaBrutaCalculada,
    recPropriosCalculado, saldoRecursosCalculado, valorMinimoAto
  } = dados;

  const setElText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = formatarMoeda(val).replace('R$', '').trim(); };
  setElText(`${sistema}-val-imovel`, valorImovel);
  setElText(`${sistema}-val-subsidio`, valorSubsidio);
  setElText(`${sistema}-val-imovel-liquido`, valorImovelLiquido);
  setElText(`${sistema}-val-financiamento`, valorFinanciamentoCalculado);
  setElText(`${sistema}-val-entrada-total`, entradaTotalCalculada);
  setElText(`${sistema}-val-fgts`, valorFgts);
  setElText(`${sistema}-val-bom-pagador`, valorBomPagador);
  setElText(`${sistema}-val-entrada-bruta`, entradaBrutaCalculada);
  setElText(`${sistema}-val-recursos`, recPropriosCalculado);
  setElText(`${sistema}-val-saldo-rec`, saldoRecursosCalculado);

  const inputAto = document.getElementById(`${sistema}-val-ato`) || document.getElementById(`${sistema}-input-ato`);
  const pctAto = document.getElementById(`${sistema}-pct-ato`);
  const spanSinal = document.getElementById(`${sistema}-val-sinal`);
  const inputQtdParcSinal = document.getElementById(`${sistema}-parc-sinal`);
  
  let spanDeParcSinal = document.getElementById(`${sistema}-de-parc-sinal`);
  if (inputQtdParcSinal && !spanDeParcSinal) {
    spanDeParcSinal = document.createElement("span");
    spanDeParcSinal.id = `${sistema}-de-parc-sinal`;
    spanDeParcSinal.style.cssText = "font-size: 0.75rem; font-weight: bold; color: #333; margin-left: 4px; white-space: nowrap;";
    inputQtdParcSinal.parentNode.appendChild(spanDeParcSinal);
  }

  const spanEntradaLiq = document.getElementById(`${sistema}-val-entrada-liquida`);
  const inputQtdParcLiq = document.getElementById(`${sistema}-parc-liquida`);

  let spanDeParcLiq = document.getElementById(`${sistema}-de-parc-liquida`);
  if (inputQtdParcLiq && !spanDeParcLiq) {
    spanDeParcLiq = document.createElement("span");
    spanDeParcLiq.id = `${sistema}-de-parc-liquida`;
    spanDeParcLiq.style.cssText = "font-size: 0.75rem; font-weight: bold; color: #333; margin-left: 4px; white-space: nowrap;";
    inputQtdParcLiq.parentNode.appendChild(spanDeParcLiq);
  }

  if (inputAto) {
    let valorAtualAto = converterMoedaParaNumero(inputAto.value);

    // Se o usuário não mexeu no campo ou o valor está zerado/vazio, assume o mínimo de 0,2% do imóvel automaticamente
    if (!inputAto.dataset.usuarioEditou || valendoZeroOuVazio(inputAto.value) || valorAtualAto < valorMinimoAto) {
      valorAtualAto = valorMinimoAto;
      inputAto.value = formatarMoeda(valorAtualAto);
    }

    let percentualAto = valorImovel > 0 ? (valorAtualAto / valorImovel) * 100 : 0;
    if (pctAto) pctAto.value = percentualAto.toFixed(1).replace(".", ",") + "%";

    let calculoBrutoSinal = (valorImovel * 0.015) - valorAtualAto;
    let valorSinalCalculado = calculoBrutoSinal > 0 ? calculoBrutoSinal : 0;

    if (spanSinal) {
      spanSinal.innerText = formatarMoeda(valorSinalCalculado).replace('R$', '').trim();
    }

    if (spanDeParcSinal) {
      let qtdParcelasSinal = parseInt(inputQtdParcSinal?.value) || 5;
      if (qtdParcelasSinal < 1) qtdParcelasSinal = 1;
      if (qtdParcelasSinal > 5) qtdParcelasSinal = 5;
      let valorParcelaSinal = (valorSinalCalculado > 0) ? (valorSinalCalculado / qtdParcelasSinal) : 0;
      spanDeParcSinal.innerText = `DE: ${formatarMoeda(valorParcelaSinal)}`;
    }

    let calculoBrutoEntLiq = entradaBrutaCalculada - valorAtualAto - valorSinalCalculado;
    let valorEntradaLiqCalculado = calculoBrutoEntLiq > 0 ? calculoBrutoEntLiq : 0;

    if (spanEntradaLiq) {
      spanEntradaLiq.innerText = formatarMoeda(valorEntradaLiqCalculado).replace('R$', '').trim();
    }

    if (spanDeParcLiq) {
      let qtdParcelasLiq = parseInt(inputQtdParcLiq?.value) || 30;
      if (qtdParcelasLiq < 1) qtdParcelasLiq = 1;
      let valorParcelaLiq = (valorEntradaLiqCalculado > 0) ? (valorEntradaLiqCalculado / qtdParcelasLiq) : 0;
      spanDeParcLiq.innerText = `DE: ${formatarMoeda(valorParcelaLiq)}`;
    }

    if (!inputAto.dataset.validado) {
      inputAto.dataset.validado = "true";
      
      // Valida o teto mínimo de 0.2% apenas ao sair do campo (blur)
      inputAto.addEventListener('blur', () => {
        let val = converterMoedaParaNumero(inputAto.value);
        if (val > 0 && val < valorMinimoAto) {
          alert("O valor do Ato não pode ser inferior a 0,2% do valor do imóvel. O valor foi ajustado para o mínimo de 0,2%.");
          inputAto.value = formatarMoeda(valorMinimoAto);
        }
        simularFluxo();
      });

      // Marca que o usuário editou para o script respeitar o valor customizado dele
      inputAto.addEventListener('input', () => {
        inputAto.dataset.usuarioEditou = "true";
        simularFluxo();
      });
    }

    if (inputQtdParcSinal && !inputQtdParcSinal.dataset.escutando) {
      inputQtdParcSinal.dataset.escutando = "true";
      inputQtdParcSinal.addEventListener('input', () => simularFluxo());
    }
    if (inputQtdParcLiq && !inputQtdParcLiq.dataset.escutando) {
      inputQtdParcLiq.dataset.escutando = "true";
      inputQtdParcLiq.addEventListener('input', () => simularFluxo());
    }
  }
}

function valendoZeroOuVazio(valStr) {
  if (!valStr) return true;
  let limpo = valStr.replace("R$", "").trim();
  return limpo === "" || limpo === "0,00" || limpo === "0" || limpo === "0,05";
}


// =================================================
// 5. ORQUESTRAÇÃO GERAL (simularFluxo)
// =================================================

function simularFluxo() {
  const selectMunicipio = document.getElementById("sim-cidade") || document.getElementById("cidade");
  const cidadeImovel = selectMunicipio ? selectMunicipio.value : "São Paulo";
  const dadosCidade = tabelaCidades.find(c => c.municipio === cidadeImovel);
  const tetoImovel = dadosCidade ? dadosCidade.teto : 275000;

  const tipoBaseImovel = document.querySelector('input[name="base-financiamento"]:checked')?.value || "imovel";
  
  const inputImovelEl = document.getElementById("sim-val-imovel") || document.getElementById("sim-imovel") || document.getElementById("imovel");
  const inputAvaliacaoEl = document.getElementById("sim-val-avaliacao") || document.getElementById("sim-avaliacao") || document.getElementById("avaliacao");
  const valImovelInput = converterMoedaParaNumero(inputImovelEl?.value);
  const valAvaliacaoInput = converterMoedaParaNumero(inputAvaliacaoEl?.value);
  const valorImovel = tipoBaseImovel === "avaliacao" ? valAvaliacaoInput : valImovelInput;
  
  const inputRendaEl = document.getElementById("sim-renda") || document.getElementById("renda") || document.getElementById("sim-renda-bruta");
  const rendaBruta = converterMoedaParaNumero(inputRendaEl?.value);

  const inputFgtsEl = document.getElementById("sim-fgts") || document.getElementById("fgts");
  const valorFgts = converterMoedaParaNumero(inputFgtsEl?.value);

  const inputBomPagEl = document.getElementById("sim-bom-pagador") || document.getElementById("bom-pagador");
  const valorBomPagador = converterMoedaParaNumero(inputBomPagEl?.value);

  const inputRecursosEl = document.getElementById("sim-recursos") || document.getElementById("recursos");
  const valorRecursos = converterMoedaParaNumero(inputRecursosEl?.value);

  const { prazoMaximoPermitido, idade } = calcularPrazoMaximoPorIdade();
  const inputPrazoEl = document.getElementById("sim-prazo-finan") || document.getElementById("prazo-finan") || document.getElementById("prazo");
  const prazoInput = parseInt(inputPrazoEl?.value) || prazoMaximoPermitido;
  const numeroParcelas = Math.min(prazoInput, prazoMaximoPermitido);

  const redutorRadio = document.querySelector('input[name="opt-redutor"]:checked')?.value || "sim";
  const redutorCotista = redutorRadio === "sim" ? "Sim" : "Não"; 

  let taxaAnualNominal = obterTaxaAnualPROCX(valorImovel, tetoImovel, rendaBruta, redutorCotista);
  let taxaNominalMensal = Math.pow(1 + taxaAnualNominal, 1/12) - 1;

  let aliquotaMIPSAC = obterMIPSACPorRenda(rendaBruta);
  let aliquotaDFISAC = parametrosSAC.aliquotaDFI;
  let valorManutencaoSAC = parametrosSAC.valorManutencao;

  let aliquotaMIPPrice = obterMIPPricePorRenda(rendaBruta);
  let aliquotaDFIPrice = parametrosPRICE.aliquotaDFI;
  let valorManutencaoPrice = parametrosPRICE.valorManutencao;

  const chkDependente = document.getElementById("sim-dependente") || document.getElementById("dependente");
  const temCompradorVal = chkDependente ? chkDependente.checked : false;

  const valorSubsidio = calcularSubsidioMCMV({
      valorImovel: valorImovel,
      tetoMunicipio: tetoImovel,
      idadeMaisVelho: idade,
      maxParcelas: numeroParcelas,
      possuiRedutor: (redutorRadio === "sim"),
      temCompradorOuDependente: temCompradorVal,
      rendaBruta: rendaBruta
  });

  const inputSubsidioTela = document.getElementById("sim-subsidio-val") || document.getElementById("subsidio-val");
  if (inputSubsidioTela) {
      inputSubsidioTela.value = formatarMoeda(valorSubsidio);
  }

  const valorImovelLiquido = Math.max(0, valorImovel - valorSubsidio);
  const prestacaoMaximaRenda = rendaBruta * 0.30;
  
  let valorFinanciamentoCalculado = 0;
  if (prestacaoMaximaRenda > 0 && numeroParcelas > 0) {
    let limiteMaximoFinan = valorImovelLiquido * 0.80;
    
    function calcularPrimeiraPrestacaoSAC(v) {
      if (v <= 0) return 0;
      let amort1 = v / numeroParcelas;
      let juros1 = v * taxaNominalMensal;
      let sd1 = v - amort1;
      let mip = sd1 * aliquotaMIPSAC;
      let dfi = valorImovel * aliquotaDFISAC;
      return amort1 + juros1 + mip + dfi + valorManutencaoSAC;
    }

    let minV = 0, maxV = limiteMaximoFinan;
    if (calcularPrimeiraPrestacaoSAC(maxV) <= prestacaoMaximaRenda) {
      valorFinanciamentoCalculado = maxV;
    } else {
      for (let i = 0; i < 60; i++) {
        let midV = (minV + maxV) / 2;
        if (calcularPrimeiraPrestacaoSAC(midV) <= prestacaoMaximaRenda) minV = midV;
        else maxV = midV;
      }
      valorFinanciamentoCalculado = minV;
    }
    if (valorFinanciamentoCalculado > limiteMaximoFinan) valorFinanciamentoCalculado = limiteMaximoFinan;
  }

  let valorFinanciamentoPrice = 0;
  if (prestacaoMaximaRenda > 0 && numeroParcelas > 0) {
    let limiteMaximoFinan = valorImovelLiquido * 0.80;
    
    function calcularPrimeiraPrestacaoPrice(v) {
      if (v <= 0) return 0;
      let pmt = taxaNominalMensal > 0 ? v * (taxaNominalMensal * Math.pow(1 + taxaNominalMensal, numeroParcelas)) / (Math.pow(1 + taxaNominalMensal, numeroParcelas) - 1) : v / numeroParcelas;
      let juros1 = v * taxaNominalMensal;
      let amort1 = pmt - juros1;
      let sd1 = v - amort1; 
      let mip = sd1 * aliquotaMIPPrice;
      let dfi = valorImovel * aliquotaDFIPrice; 
      return pmt + mip + dfi + valorManutencaoPrice;
    }

    let minV = 0, maxV = limiteMaximoFinan;
    if (calcularPrimeiraPrestacaoPrice(maxV) <= prestacaoMaximaRenda) {
      valorFinanciamentoPrice = maxV;
    } else {
      for (let i = 0; i < 60; i++) {
        let midV = (minV + maxV) / 2;
        if (calcularPrimeiraPrestacaoPrice(midV) <= prestacaoMaximaRenda) minV = midV;
        else maxV = midV;
      }
      valorFinanciamentoPrice = minV;
    }
    if (valorFinanciamentoPrice > limiteMaximoFinan) valorFinanciamentoPrice = limiteMaximoFinan;
  }

  const entradaTotalCalculada = Math.max(0, valorImovelLiquido - valorFinanciamentoCalculado);
  const entradaBrutaCalculada = Math.max(0, entradaTotalCalculada - valorFgts - valorBomPagador);
  const recPropriosCalculado = valorRecursos;
  const saldoRecursosCalculado = Math.max(0, entradaBrutaCalculada - recPropriosCalculado - valorFgts);
  const valorMinimoAto = valorImovel * 0.002;

  const dadosComunsCard = {
    valorImovel, valorSubsidio, valorImovelLiquido, valorFinanciamentoCalculado,
    entradaTotalCalculada, valorFgts, valorBomPagador, entradaBrutaCalculada,
    recPropriosCalculado, saldoRecursosCalculado, valorMinimoAto
  };

  atualizarCardFinanciamento('sac', dadosComunsCard);

  const resultadoSAC = simularMotorSAC({
    valorFinanciamento: valorFinanciamentoCalculado,
    valorImovel: valorImovel,
    taxaMensal: taxaNominalMensal,
    numeroParcelas: numeroParcelas,
    aliquotaMIP: aliquotaMIPSAC,
    aliquotaDFI: aliquotaDFISAC,
    valorManutencao: valorManutencaoSAC
  });

  const entradaTotalCalculadaPrice = Math.max(0, valorImovelLiquido - valorFinanciamentoPrice);
  const entradaBrutaCalculadaPrice = Math.max(0, entradaTotalCalculadaPrice - valorFgts - valorBomPagador);
  const saldoRecursosCalculadoPrice = Math.max(0, entradaBrutaCalculadaPrice - valorRecursos - valorFgts);

  const resultadoPrice = simularMotorPRICE({
    valorFinanciamento: valorFinanciamentoPrice,
    valorImovel: valorImovel,
    taxaMensal: taxaNominalMensal,
    numeroParcelas: numeroParcelas,
    aliquotaMIP: aliquotaMIPPrice,
    aliquotaDFI: aliquotaDFIPrice,
    valorManutencao: valorManutencaoPrice
  });

  atualizarCardFinanciamento('price', {
    valorImovel, valorSubsidio, valorImovelLiquido,
    valorFinanciamentoCalculado: valorFinanciamentoPrice,
    entradaTotalCalculada: entradaTotalCalculadaPrice,
    valorFgts, valorBomPagador,
    entradaBrutaCalculada: entradaBrutaCalculadaPrice,
    recPropriosCalculado: valorRecursos,
    saldoRecursosCalculado: saldoRecursosCalculadoPrice,
    valorMinimoAto
  });

  popularTabelaComparativa(resultadoSAC.prestacoes, resultadoPrice.prestacoes);
  atualizarCabecalhosDinamicos(valorImovel, valorFinanciamentoCalculado, valorFinanciamentoPrice, taxaAnualNominal);

  return {
    valorImovel,
    valorFinanciamento: valorFinanciamentoCalculado,
    valorFinanciamentoPrice: valorFinanciamentoPrice,
    valorSubsidio,
    entradaTotal: entradaTotalCalculada,
    tabelaPrice: resultadoPrice.prestacoes,
    tabelaSac: resultadoSAC.prestacoes
  };
}


// =================================================
// 6. MOTORES DE CÁLCULO (SAC E PRICE) E TABELA
// =================================================

function simularMotorSAC(dadosFinanciamento) {
  const valorFinanciamento = dadosFinanciamento?.valorFinanciamento || 0;
  const valorImovel = dadosFinanciamento?.valorImovel || valorFinanciamento;
  const taxaMensal = dadosFinanciamento?.taxaMensal || 0;
  const numeroParcelas = dadosFinanciamento?.numeroParcelas || 420;
  
  const aliquotaMIP = dadosFinanciamento?.aliquotaMIP !== undefined ? dadosFinanciamento.aliquotaMIP : 0.00052;
  const aliquotaDFI = dadosFinanciamento?.aliquotaDFI !== undefined ? dadosFinanciamento.aliquotaDFI : parametrosSAC.aliquotaDFI;
  const valorManutencao = dadosFinanciamento?.valorManutencao !== undefined ? dadosFinanciamento.valorManutencao : parametrosSAC.valorManutencao;

  let prestacoesSAC = [];
  if (valorFinanciamento <= 0 || numeroParcelas <= 0) return { prestacoes: prestacoesSAC };

  let amortizacaoConstante = valorFinanciamento / numeroParcelas;
  let saldoDevedor = valorFinanciamento;

  for (let mes = 1; mes <= numeroParcelas; mes++) {
    let jurosMes = saldoDevedor * taxaMensal;
    let amortizacaoMes = (mes === numeroParcelas) ? saldoDevedor : amortizacaoConstante;
    
    saldoDevedor -= amortizacaoMes;
    if (saldoDevedor < 0) saldoDevedor = 0;

    let mipMes = saldoDevedor * aliquotaMIP;
    let dfiMes = valorImovel * aliquotaDFI; 
    let prestacaoTotalMes = amortizacaoMes + jurosMes + mipMes + dfiMes + valorManutencao;

    prestacoesSAC.push({
      mes, saldoDevedor, juros: jurosMes, amortizacao: amortizacaoMes,
      mip: mipMes, dfi: dfiMes, manutencao: valorManutencao, prestacaoTotal: prestacaoTotalMes
    });
  }
  return { prestacoes: prestacoesSAC };
}

function simularMotorPRICE(dadosFinanciamento) {
  const valorFinanciamento = dadosFinanciamento?.valorFinanciamento || 0;
  const valorImovel = dadosFinanciamento?.valorImovel || valorFinanciamento;
  const taxaMensal = dadosFinanciamento?.taxaMensal || 0;
  const numeroParcelas = dadosFinanciamento?.numeroParcelas || 420;
  
  const aliquotaMIP = dadosFinanciamento?.aliquotaMIP !== undefined ? dadosFinanciamento.aliquotaMIP : 0.0004;
  const aliquotaDFI = dadosFinanciamento?.aliquotaDFI !== undefined ? dadosFinanciamento.aliquotaDFI : parametrosPRICE.aliquotaDFI;
  const valorManutencao = dadosFinanciamento?.valorManutencao !== undefined ? dadosFinanciamento.valorManutencao : parametrosPRICE.valorManutencao;

  let prestacoesPRICE = [];
  let primeiraPrestacao = 0;

  if (valorFinanciamento <= 0 || numeroParcelas <= 0) return { prestacoes: prestacoesPRICE, primeiraPrestacao };

  let pmtBase = taxaMensal > 0 ? valorFinanciamento * (taxaMensal * Math.pow(1 + taxaMensal, numeroParcelas)) / (Math.pow(1 + taxaMensal, numeroParcelas) - 1) : valorFinanciamento / numeroParcelas;
  let saldoDevedor = valorFinanciamento;

  for (let mes = 1; mes <= numeroParcelas; mes++) {
    let jurosMes = saldoDevedor * taxaMensal;
    let amortizacaoMes = pmtBase - jurosMes;
    
    if (mes === numeroParcelas) {
      amortizacaoMes = saldoDevedor;
      pmtBase = amortizacaoMes + jurosMes;
    }

    saldoDevedor -= amortizacaoMes;
    if (saldoDevedor < 0) saldoDevedor = 0;

    let mipMes = saldoDevedor * aliquotaMIP;
    let dfiMes = valorImovel * aliquotaDFI; 
    let prestacaoTotalMes = pmtBase + mipMes + dfiMes + valorManutencao;

    if (mes === 1) primeiraPrestacao = prestacaoTotalMes;

    prestacoesPRICE.push({
      mes, saldoDevedor, juros: jurosMes, amortizacao: amortizacaoMes,
      prestacaoBase: pmtBase, mip: mipMes, dfi: dfiMes, manutencao: valorManutencao, prestacaoTotal: prestacaoTotalMes
    });
  }
  return { prestacoes: prestacoesPRICE, primeiraPrestacao };
}

function popularTabelaComparativa(cronogramaSac, cronogramaPrice) {
    const tbody = document.getElementById("tabela-unificada-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const totalLinhas = Math.max(cronogramaSac.length, cronogramaPrice.length);

    let somaSacParcelas = 0;
    let somaPriceParcelas = 0;

    for (let i = 0; i < totalLinhas; i++) {
        let sac = cronogramaSac[i] || { mes: i + 1, prestacaoTotal: 0, amortizacao: 0, juros: 0, saldoDevedor: 0 };
        let price = cronogramaPrice[i] || { mes: i + 1, prestacaoTotal: 0, amortizacao: 0, juros: 0, saldoDevedor: 0 };

        somaSacParcelas += sac.prestacaoTotal;
        somaPriceParcelas += price.prestacaoTotal;

        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${sac.mes || price.mes}</td>
            
            <!-- SISTEMA SAC -->
            <td style="background: #e8f5e9;">${formatarMoeda(sac.prestacaoTotal)}</td>
            <td style="background: #e8f5e9; font-weight: 500; color: #004d40;">${formatarMoeda(sac.amortizacao)}</td>
            <td style="background: #e8f5e9;">${formatarMoeda(sac.juros)}</td>
            <td style="background: #e8f5e9;">${formatarMoeda(sac.saldoDevedor)}</td>
            
            <!-- SISTEMA PRICE -->
            <td style="background: #f5f5f5;">${formatarMoeda(price.prestacaoTotal)}</td>
            <td style="background: #f5f5f5; font-weight: 500; color: #004d40;">${formatarMoeda(price.amortizacao)}</td>
            <td style="background: #f5f5f5;">${formatarMoeda(price.juros)}</td>
            <td style="background: #f5f5f5;">${formatarMoeda(price.saldoDevedor)}</td>
        `;
        tbody.appendChild(tr);
    }

    // Atualiza os totais calculados nos elementos do cabeçalho
    const elSacTotal = document.getElementById("res-sac-total-parcela");
    const elPriceTotal = document.getElementById("res-price-total-parcela");

    if (elSacTotal) elSacTotal.innerText = formatarMoeda(somaSacParcelas);
    if (elPriceTotal) elPriceTotal.innerText = formatarMoeda(somaPriceParcelas);
}

function imprimirResultado(sistema) {
  window.print();
}


// =================================================
// 7. INICIALIZAÇÃO E EVENTOS DOM
// =================================================

document.addEventListener("DOMContentLoaded", function() {
  inicializarMunicipios();

  const selectMunicipio = document.getElementById("sim-cidade") || document.getElementById("cidade");
  if (selectMunicipio) {
    selectMunicipio.addEventListener("change", () => {
      atualizarTetoCidade();
    });
  }

  atualizarTetoCidade();

  const inputDataNasc = document.getElementById("sim-data-nasc") || document.getElementById("data-nasc");
  if (inputDataNasc) {
    inputDataNasc.addEventListener("change", () => {
      calcularPrazoMaximoPorIdade();
      simularFluxo();
    });
    inputDataNasc.addEventListener("input", () => {
      calcularPrazoMaximoPorIdade();
    });
    calcularPrazoMaximoPorIdade();
  }

  const idsInputs = [
    "sim-val-imovel", "sim-imovel", "imovel",
    "sim-val-avaliacao", "sim-avaliacao", "avaliacao",
    "sim-renda", "renda", "sim-renda-bruta",
    "sim-fgts", "fgts",
    "sim-bom-pagador", "bom-pagador",
    "sim-recursos", "recursos",
    "sim-prazo-finan", "prazo-finan", "prazo"
  ];

  idsInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.escutandoInput) {
      el.dataset.escutandoInput = "true";
      el.addEventListener("input", () => simularFluxo());
      el.addEventListener("change", () => simularFluxo());
    }
  });

  const radiosRedutor = document.querySelectorAll('input[name="opt-redutor"]');
  radiosRedutor.forEach(radio => {
    radio.addEventListener("change", () => simularFluxo());
  });

  const chkDependente = document.getElementById("sim-dependente") || document.getElementById("dependente");
  if (chkDependente) {
    chkDependente.addEventListener("change", () => simularFluxo());
  }

  const radiosBase = document.querySelectorAll('input[name="base-financiamento"]');
  radiosBase.forEach(radio => {
    radio.addEventListener("change", () => simularFluxo());
  });

  simularFluxo();
});
