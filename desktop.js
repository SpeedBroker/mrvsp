// =========================================================================
// CAMADA INTERNA DE CONTROLE DE ACESSO - SPEEDBROKER (MÓDULO SEGURO)
// =========================================================================
(function() {
  const URL_API_GOOGLE = "https://script.google.com/macros/s/AKfycbwXlu0K9kGfFa0yxhhsUoX5MKz3clEOUPUSpuh_2zcS5eqtWzMLIrQezwumD2sd9m4/exec"; 

  // Espelho de segurança idêntico à sua planilha para validação local imediata
  const GERENTES_PERMITIDOS = {
    "Isnaldo2z3v": "Isnaldo",
    "Vitor2f5d": "Vitor",
    "Suzi32nn": "Suzi",
    "Marcelo42m3": "Marcelo",
    "ChicãoCa22": "Chicão",
    "LacerdaC323": "Lacerda",
    "Cris2a20": "Cris",
    "Fabio9a24": "Fabio",
    "Andrew5v3v": "Andrew",
    "Cavani3a25": "Cavani"
  };

  function obterParametroUrl(nome) {
    var regex = new RegExp('[\\?&]' + nome + '=([^&#]*)');
    var resultados = regex.exec(location.search);
    return resultados === null ? '' : decodeURIComponent(resultados[1].replace(/\+/g, ' '));
  }

  const codigoRef = obterParametroUrl('ref');
  const telaBloqueio = document.getElementById('bloqueio-seguranca');
  const containerResultado = document.getElementById('resultado-validacao');
  const iconeStatus = document.getElementById('icone-status');

  // 1. BLOQUEIO SE A URL FOR INCOMPLETA OU COM GERENTE NÃO CADASTRADO
  if (!codigoRef || !GERENTES_PERMITIDOS[codigoRef.trim()]) {
    localStorage.removeItem('speedbroker_username');
    exibirPainelErro("Acesso Negado", "Este código de gerente não está autorizado ou é inválido.");
    throw new Error("Acesso interrompido: Chave de referência inválida.");
  }

  // 2. SOLICITAÇÃO OU CAPTURA DO USUÁRIO (GUIA ANÔNIMA / PRIMEIRO ACESSO)
  let nomeCorretor = localStorage.getItem('speedbroker_username');

  if (!nomeCorretor) {
    exibirFormularioIdentificacao();
  } else {
    // Gerente válido com usuário salvo: Registra em segundo plano e libera na hora!
    registrarAcessoPlanilha(codigoRef.trim(), nomeCorretor);
    liberarInterfaceDashboard();
  }

  function exibirFormularioIdentificacao() {
    if (iconeStatus) {
      iconeStatus.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#004d24"/>
            <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="white"/>
            <path d="M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
        </svg>
      `;
    }
    if (containerResultado) {
      containerResultado.innerHTML = `
        <h2 style="color: #004d24; margin-bottom: 10px; font-size: 1.2rem;">Primeiro Acesso</h2>
        <p style="color: #555; font-size: 13px; margin-bottom: 15px;">Por favor, digite seu nome para ativar as configurações do seu painel regional.</p>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%;">
          <input type="text" id="input-nome-corretor" placeholder="Seu nome..." style="width: 80%; padding: 10px; border: 2px solid #ccc; border-radius: 4px; font-size: 14px; text-align: center; outline: none;">
          <button id="btn-salvar-corretor" style="background-color: #febd11; color: #004d24; font-weight: bold; border: none; padding: 10px 25px; border-radius: 4px; cursor: pointer; text-transform: uppercase; font-size: 12px; width: 80%;">Entrar no Dashboard</button>
        </div>
      `;

      document.getElementById('btn-salvar-corretor').addEventListener('click', function() {
        const nomeDigitado = document.getElementById('input-nome-corretor').value.trim();
        if (!nomeDigitado || nomeDigitado.length < 2) {
          alert("Por favor, digite um nome válido.");
          return;
        }
        localStorage.setItem('speedbroker_username', nomeDigitado);
        
        // Registra em segundo plano e já libera a tela imediatamente
        registrarAcessoPlanilha(codigoRef.trim(), nomeDigitado);
        liberarInterfaceDashboard();
      });
    }
  }

  // 3. ENVIAR COMANDO DE LOG PARA A PLANILHA EM SEGUNDO PLANO
  function registrarAcessoPlanilha(ref, usuario) {
    const urlFinal = `${URL_API_GOOGLE}?ref=${ref}&userID=${encodeURIComponent(usuario)}&_cb=${new Date().getTime()}`;
    
    console.log("Sincronizando registro com o servidor de logs...");
    
    fetch(urlFinal, { method: 'GET', mode: 'cors' })
      .then(response => response.json())
      .then(dados => console.log("Planilha atualizada:", dados))
      .catch(erro => console.warn("Log enviado (Navegador tratando resposta CORS de forma assíncrona)"));
  }

  function liberarInterfaceDashboard() {
    console.log("Acesso validado localmente. Painel SpeedBroker liberado.");
    if (telaBloqueio) {
      telaBloqueio.style.transition = "opacity 0.4s ease";
      telaBloqueio.style.opacity = "0";
      setTimeout(() => { telaBloqueio.style.display = "none"; }, 400);
    }
  }

  function exibirPainelErro(titulo, mensagem) {
    if (iconeStatus) {
      iconeStatus.innerHTML = `
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#d93025"/>
            <path d="M12 8V13M12 16H12.01" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      `;
    }
    if (containerResultado) {
      containerResultado.innerHTML = `
        <h2 style="color: #d93025; margin-bottom: 5px;">${titulo}</h2>
        <p style="color: #666; font-size: 14px; max-width: 280px; margin: 0 auto;">${mensagem}</p>
      `;
    }
    if (document.getElementById('lista-imoveis')) document.getElementById('lista-imoveis').innerHTML = '';
    if (document.getElementById('caixa-a')) document.getElementById('caixa-a').innerHTML = '';
  }
})();

// O SEU BLOCO1 COMEÇA EXATAMENTE ABAIXO DESTA LINHA
