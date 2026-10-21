
(function(){
  /* ---------- navegação entre páginas ---------- */
  const pages = [...document.querySelectorAll('[data-page]')];
  const navLinks = [...document.querySelectorAll('nav.main a')];
  const baseTitle = document.title; let first = true;
  /* leva o foco ao novo conteúdo, para leitores de tela perceberem a troca */
  function focusEl(el){ if (el.tagName === 'DETAILS') el = el.querySelector('summary'); if (!el.hasAttribute('tabindex') && el.tabIndex < 0) el.tabIndex = -1; el.focus({preventScroll:true}); }
  function route(){
    const h = (location.hash || '#inicio').slice(1);
    let target = document.getElementById(h);
    /* alvo fora das páginas (ex.: #conteudo do link "Pular") mantém a página aberta */
    let page = pages.find(p => p.dataset.page === h) || (target && (target.closest('[data-page]') || pages.find(p => !p.hidden))) || pages[0];
    pages.forEach(p => p.hidden = p !== page);
    navLinks.forEach(a => { if (a.getAttribute('href') === '#' + page.dataset.page) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
    /* sublinha a área do menu que contém a página aberta */
    groups.forEach(b => b.parentNode.classList.toggle('cur', !!b.parentNode.querySelector('a[aria-current]')));
    closeMenus();
    /* no celular o menu rola de lado: traz a área da página aberta para dentro da tela (só na horizontal) */
    const cur = navBox.querySelector('.grp.cur > button, .menu > li > a[aria-current]');
    if (cur) { const r = cur.getBoundingClientRect(), box = navBox.getBoundingClientRect(), pad = 44;
      if (r.left < box.left + pad || r.right > box.right - pad) navBox.scrollLeft += r.left - box.left - pad; }
    const h1 = page.querySelector('h1'), moveFocus = !first; first = false;
    document.title = page === pages[0] ? baseTitle : h1.textContent + ' | ' + baseTitle;
    if (target && target.tagName === 'DETAILS') target.open = true;
    if (target && !target.dataset.page) setTimeout(() => { if (moveFocus) focusEl(target); target.scrollIntoView({block:'start'}); }, 30);
    else { window.scrollTo(0,0); if (moveFocus) focusEl(h1); }
  }
  /* ---------- áreas do menu: cada botão abre e fecha o seu painel ---------- */
  const groups = [...document.querySelectorAll('nav.main .grp > button')];
  const panelOf = b => document.getElementById(b.getAttribute('aria-controls'));
  function closeMenus(except){ groups.forEach(b => { if (b !== except) { b.setAttribute('aria-expanded','false'); panelOf(b).hidden = true; } }); }
  groups.forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    closeMenus(b); b.setAttribute('aria-expanded', String(open)); panelOf(b).hidden = !open;
  }));
  /* Esc fecha o painel e devolve o foco ao botão; clicar fora também fecha */
  document.querySelector('nav.main').addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const b = groups.find(x => x.getAttribute('aria-expanded') === 'true');
    if (b) { closeMenus(); b.focus(); e.stopPropagation(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('nav.main .grp')) closeMenus(); });
  /* o painel também fecha quando o foco sai dele pelo teclado */
  document.addEventListener('focusin', e => { if (!e.target.closest('nav.main .grp')) closeMenus(); });

  addEventListener('hashchange', route);
  /* menu rola na horizontal: mantém o item focado pelo teclado inteiro na tela */
  document.querySelectorAll('.menu > li > a, .grp > button').forEach(a => a.addEventListener('focus', () => a.scrollIntoView({block:'nearest', inline:'nearest'})));
  /* mostra setas nas bordas do menu enquanto houver itens fora da tela */
  const navEl = document.querySelector('nav.main'), navBox = navEl.querySelector('.wrap');
  function navEdges(){ const max = navBox.scrollWidth - navBox.clientWidth; navEl.classList.toggle('more-left', navBox.scrollLeft > 4); navEl.classList.toggle('more-right', navBox.scrollLeft < max - 4); }
  navBox.addEventListener('scroll', navEdges, {passive:true}); addEventListener('resize', navEdges); navEdges();

  /* ---------- questionário ---------- */
  const form = document.getElementById('quiz'), out = document.getElementById('resultado');
  const ajuda = ' Se não puder pagar advogado, procure a <a href="#defensoria">Defensoria Pública</a>.';
  /* o texto final evita promessa: indica o caminho que costuma ser o adequado, sem garantir o resultado */
  function show(cls,t,h){ out.className='result '+cls; out.innerHTML='<strong>'+t+'</strong><p>'+h+'</p><p class="small">Com base nas respostas, este caminho pode ser pertinente. A indicação é educativa: não avalia se você tem razão e não substitui a análise do caso concreto. Confira as regras do tribunal da sua cidade.</p>'; }
  const inicial = out.innerHTML, inicialCls = out.className;
  form.addEventListener('submit', e => e.preventDefault());
  /* "Recomeçar" limpa as respostas e volta à mensagem inicial */
  form.addEventListener('reset', () => setTimeout(() => { out.className = inicialCls; out.innerHTML = inicial; form.querySelector('input').focus(); }));
  form.addEventListener('change', () => {
    const f = new FormData(form), c=f.get('contra'), t=f.get('tipo'), v=f.get('valor');
    if (t==='fam') return show('no','Em regra, este assunto não vai para o Juizado','Família e inventário costumam tramitar nas Varas de Família e Sucessões, com advogado ou defensor público. A <a href="#defensoria">Defensoria do seu estado</a> atende esses casos.');
    if (t==='trab') return show('warn','Este caso costuma ir para a Justiça do Trabalho','Na <a href="#justica-trabalho">Justiça do Trabalho</a>, o próprio trabalhador pode fazer o pedido (CLT, art. 791), mas vale buscar orientação antes: sindicato, advogado ou núcleo de prática jurídica.');
    if (!c||!t||!v) return;
    if (v==='ns') return show('warn','Primeiro, estime o valor','Some o prejuízo que você consegue comprovar (notas, recibos, orçamentos) e o que pretende pedir por dano moral. Depois volte à pergunta 3.');
    if (c==='pe'){ if(v==='20') return show('ok','Caminho possível: Juizado Especial Cível','Até 20 salários mínimos, a lei permite fazer o pedido sem advogado (Lei 9.099/1995, art. 9º), por <a href="#passos-atermacao">atermação</a>. A primeira fase não tem custas.'); if(v==='40') return show('warn','Caminho possível: Juizado Especial Cível, com advogado','Entre 20 e 40 salários mínimos, o Juizado exige advogado.'+ajuda); return show('warn','Caminho provável: Justiça comum, com advogado','Acima de 40 salários mínimos, a causa passa do limite do Juizado Especial Cível e, em regra, vai para a Vara Cível. Quem não pode pagar as custas pode pedir a <a href="#passos-custos">gratuidade da Justiça</a>; quem decide é o juiz.'+ajuda); }
    if (c==='fz'){ if(v!=='mais') return show('ok','Caminho possível: Juizado Especial da Fazenda Pública','Até 60 salários mínimos, em regra a primeira fase pode ser feita sem advogado. Confirme no Juizado da sua cidade. Confira se há esse Juizado na sua cidade, fique atento ao prazo de 5 anos e veja <a href="#passos-estado">o que precisa provar</a>.'); return show('warn','Caminho provável: Vara da Fazenda Pública, com advogado','Acima de 60 salários mínimos, a causa vai, em regra, para a Vara da Fazenda Pública, com advogado.'+ajuda); }
    if (c==='fed'){ if(v!=='mais') return show('ok','Caminho possível: Juizado Especial Federal','Causas contra o INSS, a Caixa e outros órgãos federais até 60 salários mínimos podem ser propostas sem advogado na primeira fase. A <a href="#def-dpu">DPU</a> também pode ajudar.'); return show('warn','Caminho provável: Justiça Federal, com advogado','Acima de 60 salários mínimos, a causa vai, em regra, para a Vara Federal. Procure a <a href="#def-dpu">Defensoria Pública da União</a> se não puder pagar advogado.'); }
  });

  /* ---------- defensorias ---------- */
  const busca = n => 'https://www.google.com/search?q=' + encodeURIComponent('Defensoria Pública ' + n + ' site oficial');
  const ufs = [['DPU','Defensoria Pública da União (INSS, Caixa)','https://www.dpu.def.br/'],['AC','Acre','https://defensoria.ac.def.br/'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal','https://www.defensoria.df.gov.br/'],['ES','Espírito Santo'],['GO','Goiás','https://www.defensoria.go.def.br/'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']];
  const sel = document.getElementById('uf'), link = document.getElementById('ufLink');
  ufs.forEach(([k,n]) => sel.add(new Option(n,k)));
  function setUf(){ const u = ufs.find(x=>x[0]===sel.value); link.href = u[2] || busca(u[1]); link.innerHTML = (u[2] ? 'Abrir site oficial' : 'Buscar site oficial') + '<span class="sr"> (abre em nova aba)</span>'; }
  sel.addEventListener('change', setUf); setUf();

  /* ---------- ministérios públicos ---------- */
  /* links testados em 21/10/2026; sem link (AL, PA, PI, RR) = o site não respondeu no teste, então abre uma busca */
  const buscaMp = n => 'https://www.google.com/search?q=' + encodeURIComponent('Ministério Público ' + n + ' site oficial');
  const mps = [['MPF','Ministério Público Federal (MPF Serviços)','https://www.mpf.mp.br/servicos/mpf-servicos'],['AC','Acre','https://www.mpac.mp.br/'],['AL','Alagoas'],['AP','Amapá','https://www.mpap.mp.br/'],['AM','Amazonas','https://www.mpam.mp.br/'],['BA','Bahia','https://www.mpba.mp.br/'],['CE','Ceará','https://mpce.mp.br/'],['DF','Distrito Federal e Territórios (MPDFT)','https://www.mpdft.mp.br/'],['ES','Espírito Santo','https://mpes.mp.br/'],['GO','Goiás','https://www.mpgo.mp.br/'],['MA','Maranhão','https://www.mpma.mp.br/'],['MT','Mato Grosso','https://www.mpmt.mp.br/'],['MS','Mato Grosso do Sul','https://www.mpms.mp.br/'],['MG','Minas Gerais','https://www.mpmg.mp.br/'],['PA','Pará'],['PB','Paraíba','https://www.mppb.mp.br/'],['PR','Paraná','https://mppr.mp.br/'],['PE','Pernambuco','https://portal.mppe.mp.br/'],['PI','Piauí'],['RJ','Rio de Janeiro','https://www.mprj.mp.br/'],['RN','Rio Grande do Norte','https://www.mprn.mp.br/'],['RS','Rio Grande do Sul','https://www.mprs.mp.br/'],['RO','Rondônia','https://www.mpro.mp.br/'],['RR','Roraima'],['SC','Santa Catarina','https://www.mpsc.mp.br/'],['SP','São Paulo','https://www.mpsp.mp.br/'],['SE','Sergipe','https://www.mpse.mp.br/'],['TO','Tocantins','https://www.mpto.mp.br/']];
  const mpSel = document.getElementById('mpuf'), mpLink = document.getElementById('mpLink');
  mps.forEach(([k,n]) => mpSel.add(new Option(n,k)));
  function setMp(){ const m = mps.find(x=>x[0]===mpSel.value); mpLink.href = m[2] || buscaMp(m[1]); mpLink.innerHTML = (m[2] ? 'Abrir site oficial' : 'Buscar site oficial') + '<span class="sr"> (abre em nova aba)</span>'; }
  mpSel.addEventListener('change', setMp); setMp();

  /* ---------- questionário "Onde devo buscar ajuda?" ---------- */
  /* Tudo roda aqui no navegador: nada é salvo nem enviado. Links externos testados em 21/10/2026. */
  const CANAIS = {
    ouv: ['Ouvidoria do órgão','Recebe reclamações, solicitações e denúncias sobre o serviço daquele órgão e cobra uma resposta. Procure “Ouvidoria” no site oficial dele.'],
    ouvLocal: ['Ouvidoria do estado ou da Prefeitura','Recebe manifestações sobre serviços estaduais ou municipais. Alguns estados e municípios usam o Fala.BR; outros têm canal próprio no site oficial.'],
    falabr: ['Fala.BR','Plataforma de ouvidoria da CGU para órgãos federais e para estados e municípios que aderiram a ela. Se o órgão não estiver na lista, use o canal próprio dele.','https://falabr.cgu.gov.br/'],
    corr: ['Corregedoria do órgão','Apura a conduta de servidores. Costuma receber denúncias pela ouvidoria do próprio órgão.'],
    cgu: ['Controladoria-Geral da União (CGU)','Fiscaliza o uso de recursos federais, inclusive os repassados a estados e municípios, como merenda e transporte escolar. Recebe manifestações pelo Fala.BR.','https://www.gov.br/cgu/pt-br'],
    ctrl: ['Controladoria do estado ou do município','Faz o controle interno do dinheiro estadual ou municipal. Nem todo município tem uma: procure no site oficial.'],
    tcu: ['Tribunal de Contas da União (TCU)','Fiscaliza as contas e os gastos de recursos federais. Procure a Ouvidoria no portal.','https://portal.tcu.gov.br/'],
    tce: ['Tribunal de contas do estado','Fiscaliza as contas do estado e, na maioria dos estados, também as dos municípios. Procure a Ouvidoria no site oficial.'],
    mpe: ['Ministério Público do estado (no DF, o MPDFT)','Atua em patrimônio público, direitos coletivos, meio ambiente, pessoas vulneráveis e crimes, na esfera estadual e municipal.','#mp-qual'],
    mpf: ['Ministério Público Federal','Atua quando o caso envolve a União, órgãos federais ou verbas federais.','https://www.mpf.mp.br/servicos/mpf-servicos'],
    pc: ['Polícia Civil (delegacia)','Registra boletim de ocorrência de crimes em geral. Muitos estados têm delegacia online.'],
    pf: ['Polícia Federal','Recebe comunicação de crimes federais, como fraude contra o INSS ou corrupção de servidor federal.','https://www.gov.br/pf/pt-br/canais_atendimento/comunicacao-de-crimes'],
    d100: ['Disque 100','Recebe denúncias de violações de direitos humanos, especialmente contra crianças e adolescentes, pessoas idosas e pessoas com deficiência. Gratuito, 24 horas. WhatsApp: (61) 99611-0100.','https://www.gov.br/pt-br/servicos/denunciar-violacao-de-direitos-humanos'],
    l180: ['Ligue 180','Central de Atendimento à Mulher: orienta e encaminha mulheres em situação de violência. Gratuita, 24 horas.','https://www.gov.br/mulheres/pt-br/ligue180'],
    mulher: ['Delegacia da Mulher e Casa da Mulher Brasileira','Registram a ocorrência e encaminham o pedido de medida protetiva. Veja também como pedir e como guardar provas.','#mulheres-onde'],
    ct: ['Conselho Tutelar','Órgão do município que zela pelos direitos de crianças e adolescentes. O contato fica no site da Prefeitura.'],
    def: ['Defensoria Pública','Orienta e defende de graça quem não pode pagar advogado, inclusive em casos coletivos de pessoas vulneráveis.','#defensoria'],
    procon: ['Procon','Órgão de defesa do consumidor do estado ou do município. Recebe reclamações e pode chamar a empresa para um acordo.'],
    consgov: ['consumidor.gov.br','Plataforma pública para negociar direto com a empresa. Só funciona com as empresas cadastradas.','https://www.consumidor.gov.br/'],
    juizado: ['Juizado Especial','Para pedir indenização ou cobrar um direito na Justiça, em causas de menor valor. Veja se o seu caso cabe.','#meucaso'],
    estado: ['Reparação pelo poder público','Se a falha causou prejuízo a você, é possível pedir indenização. Veja o que precisa provar.','#passos-estado'],
    denuncie: ['Como denunciar irregularidades','Tipos de manifestação, situações comuns e os principais canais, explicados.','#denuncie']
  };
  const ESFERA = {q:'O problema envolve qual governo?', o:[['fed','Governo federal','INSS, Caixa, Receita, Polícia Federal, universidade federal'],['est','Governo do estado ou do DF','Escola ou hospital estadual, Detran, polícia'],['mun','Prefeitura','Posto de saúde, escola municipal, coleta de lixo'],['ns','Não sei']]};
  const PASSOS = {
    perigo: {q:'Alguém está em perigo agora, com risco à vida ou à integridade física?', o:[['sim','Sim, há perigo agora'],['nao','Não']]},
    tema: {q:'Qual opção descreve melhor o seu problema?', o:[
      ['servico','Problema em serviço público','Atendimento negado, remédio em falta, obra parada'],
      ['adm','Conduta irregular de servidor','Pedido de dinheiro, falta ao trabalho, abuso do cargo'],
      ['recursos','Possível mau uso de dinheiro público','Obra superfaturada, licitação suspeita, desvio'],
      ['coletivo','Problema coletivo ou ambiental','Atinge muitas pessoas, poluição, desmatamento'],
      ['pessoas','Direitos de mulheres, crianças, adolescentes, pessoas idosas ou com deficiência','Violência, abandono, negligência, discriminação'],
      ['consumo','Problema de consumo ou outro conflito pessoal','Loja, banco, operadora, vizinho'],
      ['crime','Possível crime, sem perigo neste momento','Fraude, ameaça, furto, violência que já aconteceu'],
      ['ns','Não sei qual escolher']]},
    esfera: ESFERA,
    quem: {q:'Quem teve os direitos violados?', o:[['mulher','Uma mulher'],['crianca','Uma criança ou adolescente'],['idosa','Uma pessoa idosa'],['pcd','Uma pessoa com deficiência']]}
  };
  /* próximo passo depois de cada resposta (o que não está aqui vai direto ao resultado) */
  const PROXIMO = {perigo: r => r==='sim' ? null : 'tema', tema: r => ({servico:'esfera',adm:'esfera',recursos:'esfera',coletivo:'esfera',pessoas:'quem'})[r] || null};
  const fed = e => e==='fed', ns = e => e==='ns';
  function resultado(a){
    const t = a.tema, e = a.esfera, porEsfera = (f,l) => fed(e) ? f : ns(e) ? [...l,...f] : l;
    switch(t){
      case 'servico': return ['Comece pela ouvidoria','Para reclamar de um serviço público que falhou ou foi negado, o primeiro canal costuma ser a ouvidoria do órgão responsável. Se a falha causou prejuízo a você, também é possível buscar reparação.', [...porEsfera(['falabr'],['ouvLocal']),'ouv','estado','def']];
      case 'adm': return ['Ouvidoria, corregedoria e, se for crime, polícia ou Ministério Público','A conduta de servidores é apurada pela corregedoria, e a ouvidoria costuma ser a porta de entrada. Se o fato pode ser crime, como pedir dinheiro para fazer o serviço, a polícia e o Ministério Público também podem ser procurados.', ['ouv','corr',...porEsfera(['falabr','pf','mpf'],['pc','mpe'])]];
      case 'recursos': return ['Controladoria, tribunal de contas e Ministério Público','Suspeitas sobre o uso de dinheiro público são apuradas por órgãos de controle. Se a verba veio do governo federal, CGU, TCU e MPF podem atuar mesmo que o gasto tenha sido feito pelo estado ou pela Prefeitura.', fed(e) ? ['cgu','falabr','tcu','mpf'] : ns(e) ? ['ctrl','tce','mpe','cgu','tcu','mpf'] : ['ctrl','tce','mpe','cgu']];
      case 'coletivo': return ['Ministério Público e Defensoria','Problemas que atingem muitas pessoas ou o meio ambiente costumam ser levados ao Ministério Público. A Defensoria também pode atuar em casos coletivos de pessoas vulneráveis. Em dano ambiental, o órgão ambiental do município ou do estado também pode ser avisado.', [...porEsfera(['mpf'],['mpe']),'def']];
      case 'pessoas': return ({
        mulher: ['Ligue 180, Delegacia da Mulher e Defensoria','A Central 180 orienta e encaminha. A medida protetiva pode ser pedida na delegacia, na Defensoria ou no Ministério Público, sem advogado.', ['l180','mulher','def']],
        crianca: ['Conselho Tutelar, Disque 100 e Ministério Público','O Conselho Tutelar é o primeiro canal para proteger crianças e adolescentes. O Disque 100 recebe denúncias, inclusive sem identificação.', ['ct','d100','mpe']],
        idosa: ['Disque 100, Ministério Público e Defensoria','Violência, abandono ou negligência contra pessoa idosa podem ser denunciados ao Disque 100 e ao Ministério Público, que tem promotorias especializadas.', ['d100','mpe','def']],
        pcd: ['Disque 100, Ministério Público e Defensoria','Violações de direitos de pessoas com deficiência podem ser denunciadas ao Disque 100 e levadas ao Ministério Público ou à Defensoria.', ['d100','mpe','def']]
      })[a.quem];
      case 'consumo': return ['Procon, consumidor.gov.br e Juizado','Conflitos de consumo costumam começar por uma tentativa de acordo. Se não der certo, é possível ir ao Juizado. Quem não pode pagar advogado pode procurar a Defensoria.', ['procon','consgov','juizado','def']];
      case 'crime': return ['Polícia e Ministério Público','Crimes em geral são registrados na Polícia Civil. Crimes federais, como fraude contra o INSS, vão para a Polícia Federal. Se envolve violência contra a mulher, veja também a página Direitos das Mulheres.', ['pc','pf','mpe','mpf','mulher']];
      default: return ['Comece por uma orientação','Quando não está claro qual é o órgão certo, a ouvidoria do órgão envolvido costuma encaminhar a manifestação. A Defensoria pode orientar quem não pode pagar advogado.', ['ouv','def','denuncie']];
    }
  }
  const guia = document.getElementById('guia');
  let hist = [], resp = {};
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  /* na primeira pergunta não há para onde voltar */
  const voltarBtns = () => hist.length > 1 ? '<div class="row"><button type="button" class="btn line" data-a="voltar">Voltar</button><button type="button" class="btn line" data-a="recomecar">Recomeçar</button></div>' : '';
  function passo(id){
    const p = PASSOS[id];
    guia.innerHTML = '<p class="passo">Pergunta ' + (hist.length + 1) + '</p><h2 tabindex="-1">' + p.q + '</h2><div class="picks">' +
      p.o.map(([v,t,s]) => '<button type="button" class="pick" data-p="' + id + '" data-v="' + v + '">' + t + (s ? '<small>' + s + '</small>' : '') + '</button>').join('') + '</div>' + voltarBtns();
  }
  function urgente(){
    guia.innerHTML = '<h2 tabindex="-1">Ligue agora para o serviço de emergência</h2><div class="urgente" role="note"><ul>' +
      '<li><b>190</b> Polícia Militar: violência acontecendo, ameaça ou crime em andamento.</li>' +
      '<li><b>192</b> SAMU: emergência médica, pessoa ferida ou passando mal. <a href="https://www.gov.br/saude/pt-br/composicao/saes/samu-192" target="_blank" rel="noopener">Sobre o SAMU<span class="sr"> (abre em nova aba)</span></a></li>' +
      '<li><b>193</b> Corpo de Bombeiros: incêndio, resgate, acidente.</li></ul>' +
      '<p>O <strong>180</strong> (Central de Atendimento à Mulher) e o <strong>Disque 100</strong> (direitos humanos) orientam e recebem denúncias, mas <strong>não substituem</strong> o 190 ou o 192 quando há perigo imediato. Use-os depois que a pessoa estiver em segurança.</p></div>' +
      '<div class="row"><button type="button" class="btn gold" data-a="seguir">Não há perigo agora: continuar</button><button type="button" class="btn line" data-a="voltar">Voltar</button></div>';
  }
  function final(){
    const [t,d,ids] = resultado(resp);
    guia.innerHTML = '<p class="passo">Resultado</p><h2 tabindex="-1">' + t + '</h2><p>' + d + '</p><p><strong>Com base nas respostas, estes canais podem ser pertinentes:</strong></p><div class="canais">' +
      ids.map(k => { const [n,x,h] = CANAIS[k]; const ext = h && h[0] !== '#';
        return '<div class="canal"><h3>' + esc(n) + '</h3><p>' + esc(x) + '</p>' + (h ? '<a href="' + h + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + (ext ? 'Abrir site oficial<span class="sr"> (abre em nova aba)</span>' : 'Saiba mais neste site') + '</a>' : '') + '</div>'; }).join('') + '</div>' +
      '<details><summary>O que verificar antes de procurar o canal</summary><ul><li>Confira se o site é oficial: endereços terminados em .gov.br, .mp.br, .jus.br ou .def.br.</li><li>Relate fatos, com datas e locais. Uma suspeita não é prova.</li><li>Não envie documentos de outras pessoas sem necessidade.</li><li>Guarde o número de protocolo para acompanhar.</li></ul></details>' +
      '<p class="aviso">A indicação é educativa: não define qual órgão é juridicamente competente nem garante que o caso será aceito. Confira as regras do órgão responsável. Este site não registra nem envia denúncias.</p>' + voltarBtns();
  }
  function mostrar(){ const atual = hist[hist.length-1]; if (atual === 'urgente') urgente(); else if (atual === 'final') final(); else passo(atual); }
  function ir(id, foco){ hist.push(id); mostrar(); if (foco) guia.querySelector('h2').focus(); }
  guia.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p){ const id = b.dataset.p, v = b.dataset.v; resp[id] = v;
      if (id === 'perigo' && v === 'sim') return ir('urgente', true);
      const nx = PROXIMO[id] ? PROXIMO[id](v) : null; return ir(nx || 'final', true); }
    const a = b.dataset.a;
    if (a === 'voltar'){ hist.pop(); delete resp[hist[hist.length-1]]; mostrar(); guia.querySelector('h2').focus(); }
    else if (a === 'recomecar'){ hist = []; resp = {}; ir('perigo', true); }
    else if (a === 'seguir'){ ir('tema', true); }
  });
  ir('perigo', false);

  /* ---------- checklist ---------- */
  const boxes=[...document.querySelectorAll('#checklist input')], st=document.getElementById('checkStatus');
  const stat=()=>{const n=boxes.filter(b=>b.checked).length; st.textContent = n===boxes.length?'Tudo em ordem. Continue acompanhando pelo site do tribunal.':'Você marcou '+n+' de '+boxes.length+'. Peça ao advogado o que falta.';};
  try{ const s=JSON.parse(localStorage.getItem('ja-check')||'[]'); boxes.forEach((b,i)=>b.checked=!!s[i]); }catch(e){}
  boxes.forEach(b=>b.addEventListener('change',()=>{ try{localStorage.setItem('ja-check',JSON.stringify(boxes.map(x=>x.checked)));}catch(e){} stat(); })); stat();

  /* ---------- copiar ---------- */
  const cb=document.getElementById('copyBtn'), cm=document.getElementById('copyMsg'), pt=document.getElementById('promptTxt');
  cb.addEventListener('click',()=>{ const fb=()=>{const r=document.createRange();r.selectNodeContents(pt);const s=getSelection();s.removeAllRanges();s.addRange(r);cm.textContent='Texto selecionado. Copie com o botão do seu aparelho.';}; try{navigator.clipboard.writeText(pt.innerText).then(()=>cm.textContent='Copiado.',fb);}catch(e){fb();} });

  /* ---------- glossário ---------- */
  const G=[['Medida protetiva','Ordem do juiz para proteger a mulher em situação de violência, como afastar o agressor.'],['Feminicídio','Matar uma mulher por ela ser mulher. Crime com pena de 20 a 40 anos.'],['Acesso à Justiça','A possibilidade de buscar proteção para um direito ou resolver um conflito pelos meios adequados.'],['Alvará','Autorização do juiz para sacar um valor depositado no processo.'],['Assistência jurídica gratuita','Orientação e defesa feitas de graça para quem não pode pagar, principalmente pela Defensoria Pública.'],['Atermação','Quando o servidor do Juizado escreve o pedido para você, a partir do seu relato.'],['Audiência de conciliação','Reunião para tentar um acordo, antes de o juiz decidir.'],['Autor','Quem entra com a ação.'],['Citação','Aviso oficial ao réu de que ele está sendo processado.'],['Comarca','A cidade ou região atendida por um fórum.'],['Competência','Qual juiz ou tribunal é o certo para julgar aquele tipo de caso.'],['Contestação','A defesa do réu.'],['Corregedoria','Setor de um órgão público que apura a conduta dos seus servidores.'],['Cumprimento de sentença','A fase de cobrar o que foi ganho.'],['Dano material','Prejuízo em dinheiro: conserto, conta paga, salário perdido.'],['Dano moral','Sofrimento, humilhação ou abalo causado a alguém.'],['Defensoria Pública','Instituição com advogados públicos que atendem de graça quem não pode pagar.'],['Desembargador','Julgador do tribunal de segunda instância.'],['Embargos de declaração','Pedido para o juiz esclarecer uma decisão confusa ou incompleta.'],['Fazenda Pública','O poder público quando está no processo: União, Estados, DF, Municípios.'],['Gratuidade da Justiça','Benefício que pode dispensar o pagamento das custas do processo. Quem decide é o juiz.'],['Hipossuficiência','Falta de condições financeiras para pagar o processo ou um advogado.'],['Honorários','O pagamento do advogado.'],['Instância','Cada degrau do processo: juiz, tribunal, tribunais superiores.'],['Intimação','Aviso oficial às partes sobre algo que aconteceu no processo.'],['Inventário','Procedimento para listar e dividir os bens de quem faleceu.'],['Ministério Público','Instituição que defende os interesses da sociedade e acusa nos crimes.'],['Nexo causal','A ligação direta entre o fato e o dano.'],['Notícia de fato','O relato de um fato feito ao Ministério Público, que decide se há motivo para agir.'],['Ouvidoria','Canal de um órgão público que recebe reclamações, solicitações e denúncias e cobra uma resposta.'],['Petição inicial','O pedido escrito que começa o processo.'],['Prescrição','Perda do direito de processar porque o prazo passou.'],['Procuração','Documento que dá poderes ao advogado para agir em seu nome.'],['Prova','Tudo o que mostra que o fato aconteceu.'],['Recurso inominado','Recurso contra a sentença no Juizado. Exige advogado. Prazo de 10 dias.'],['Responsabilidade objetiva','Quando o Estado responde pelo dano mesmo sem culpa.'],['Réu','Contra quem a ação é movida.'],['Revelia','Quando o réu não se defende ou falta à audiência.'],['Sentença','A decisão do juiz que resolve o caso.'],['Trânsito em julgado','Quando não cabe mais recurso e a decisão vira definitiva.'],['Turma Recursal','Grupo de juízes que revê as sentenças dos Juizados.'],['Vara','A unidade do fórum onde trabalha um juiz.']];
  const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const dl=document.getElementById('glos'), none=document.getElementById('semres'), gq=document.getElementById('gbusca'), lt=document.getElementById('letters');
  const seen=new Set();
  G.forEach(([t,d])=>{ const w=document.createElement('div'); const L=norm(t)[0].toUpperCase(); if(!seen.has(L)){w.id='g-'+L; seen.add(L); const a=document.createElement('a'); a.href='#g-'+L; a.textContent=L; lt.appendChild(a);} w.dataset.k=norm(t+' '+d); w.innerHTML='<dt></dt><dd></dd>'; w.firstChild.textContent=t; w.lastChild.textContent=d; dl.appendChild(w); });
  /* ao escolher uma letra, limpa o filtro para o item aparecer */
  lt.addEventListener('click',()=>{ if(gq.value){ gq.value=''; gq.dispatchEvent(new Event('input')); } });
  gq.addEventListener('input',()=>{ const s=norm(gq.value.trim()); let n=0; [...dl.children].forEach(w=>{const m=!s||w.dataset.k.includes(s); w.hidden=!m; if(m)n++;}); none.hidden=n>0; });

  /* ---------- busca geral ---------- */
  const IDX=[
    ['Meu caso cabe no Juizado?','Questionário de 3 perguntas','meucaso','juizado direito indenização valor salário'],
    ['Como a Justiça é organizada','Ramos, instâncias e tribunais','justica','judiciário poder tribunal organização'],
    ['Os três degraus do processo','Juiz, tribunal, tribunais superiores','justica-instancias','instância recurso desembargador ministro'],
    ['Justiça Estadual','Família, consumidor, aluguel, crimes','justica-estadual','tj tjdft vara estadual'],
    ['Justiça Federal','INSS, Caixa, Receita','justica-federal','trf federal inss caixa aposentadoria'],
    ['Justiça do Trabalho','Salário, demissão, carteira','justica-trabalho','trabalhista trt tst patrão emprego'],
    ['Justiça Eleitoral','Título de eleitor e eleições','justica-eleitoral','tre tse título voto'],
    ['Tribunais superiores e CNJ','STF, STJ, TST, TSE, STM, CNJ','justica-superiores','supremo stf stj cnj reclamação juiz'],
    ['Ministério Público, Defensoria e Advocacia','Funções essenciais à Justiça','justica-funcoes','promotor mp agu procuradoria oab'],
    ['Como entrar com pedido sem advogado','Atermação no Juizado','passos-atermacao','atermação petição sozinho balcão'],
    ['Documentos e provas','O que reunir antes de ir','passos-docs','documentos provas fotos testemunha'],
    ['Prazos','5 anos, 3 anos, 10 dias','passos-prazos','prazo prescrição recurso dias'],
    ['Quanto custa','Custas e justiça gratuita','passos-custos','custas gratuita pagar'],
    ['Audiência','O que acontece se faltar','passos-audiencia','audiência conciliação faltar revelia'],
    ['O que não vai para o Juizado','Família, inventário, trabalho','passos-naojuizado','pensão divórcio guarda'],
    ['Prejuízo causado pelo poder público','Responsabilidade do Estado','passos-estado','prefeitura estado buraco hospital concurso responsabilidade'],
    ['Defensoria Pública','Advogado gratuito','defensoria','defensor gratuito advogado sem dinheiro'],
    ['Defensoria Pública da União','INSS, Caixa, benefícios federais','def-dpu','dpu inss bpc loas fgts'],
    ['Defensoria do Estado ou do DF','Família, consumidor, criminal','def-estadual','dpdf pensão divórcio violência'],
    ['Quando a Defensoria não atua','Limites e alternativas','def-naoatua','renda limite recusa'],
    ['Acompanhar seu advogado','Checklist e direitos','advogado','advogado procuração contrato honorários oab'],
    ['Sinais de alerta com advogado','Quando desconfiar','adv-alerta','golpe desconfiança dinheiro recibo'],
    ['Inventário','Cartório, prazo e imposto','adv-inventario','inventário herança herdeiros cartório itcmd'],
    ['Usar IA para entender documentos','Texto pronto para copiar','adv-ia','inteligência artificial ia chatgpt'],
    ['Glossário','Palavras do processo','glossario','significado termo palavra'],
    ['Direitos das Mulheres','Violência doméstica, Ligue 180','mulheres','mulher violência maria da penha agressão 180 doméstica'],
    ['Medida protetiva','Como pedir, sem advogado','mulheres-medida','medida protetiva afastamento agressor deam'],
    ['Feminicídio','Crime e sinais de risco','mulheres-feminicidio','feminicídio ameaça morte risco'],
    ['Onde a mulher busca ajuda','DEAM, Casa da Mulher, Defensoria','mulheres-onde','deam casa da mulher brasileira creas'],
    ['Sobre o projeto','Missão e valores','sobre','missão valores quem somos'],
    ['Base legal','Constituição, CPC, LC 80, Juizados','sobre-base','lei constituição cpc artigo fundamento'],
    ['O que o site faz e não faz','Natureza educativa e orientativa','sobre-natureza','educativo orientativo limite promessa'],
    ['Acesso à Justiça, gratuidade e assistência','Três ideias diferentes','def-conceitos','gratuidade justiça gratuita assistência jurídica custas'],
    ['Onde devo buscar ajuda?','Questionário que indica canais oficiais','ondebuscar','ajuda canal órgão denúncia emergência onde procurar'],
    ['Ministério Público: quando procurar?','O que faz e qual procurar','mp','promotor procurador mpf mp mpdft notícia de fato representação'],
    ['Quando o Ministério Público pode ajudar','Patrimônio público, meio ambiente, coletivos','mp-quando','improbidade meio ambiente coletivo creche remédio'],
    ['Encontre o Ministério Público','MPF e Ministérios Públicos dos estados','mp-qual','estado mpf mpdft site oficial'],
    ['Como denunciar irregularidades','Ouvidorias, controladorias e outros canais','denuncie','denúncia denunciar irregularidade servidor serviço público reclamação'],
    ['Pediram dinheiro para fazer o serviço','Propina, cobrança por fora','denuncie-vantagem','propina corrupção por fora suborno'],
    ['Mau uso de dinheiro público','CGU, tribunais de contas, Ministério Público','denuncie-recursos','desvio licitação superfaturamento obra tcu cgu tce'],
    ['Canais de denúncia','Fala.BR, CGU, TCU, Disque 100, Ligue 180','denuncie-canais','fala.br falabr ouvidoria corregedoria disque 100 polícia federal'],
    ['Privacidade','O que acontece com seus dados','privacidade','privacidade dados lgpd cookies'],
    ['Acessibilidade','Recursos e limites conhecidos','sobre-acess','acessibilidade leitor de tela teclado contraste']
  ].map(([t,s,id,k])=>({t,s,id,k:norm(t+' '+s+' '+k),tag:'Página'}));
  G.forEach(([t,d])=>IDX.push({t,s:d,id:'glossario',k:norm(t+' '+d),tag:'Glossário',g:t}));
  const q=document.getElementById('q'), res=document.getElementById('qres'); let cur=[], si=-1;
  function draw(){ res.innerHTML=''; cur.forEach((r,i)=>{ const li=document.createElement('li'); li.setAttribute('role','presentation'); const a=document.createElement('a'); a.href='#'+r.id; a.id='qres-'+i; a.tabIndex=-1; a.setAttribute('role','option'); a.setAttribute('aria-selected',String(i===si)); if(i===si)a.className='sel'; a.innerHTML='<span class="tagp"></span><b></b><span></span>'; a.children[0].textContent=r.tag; a.children[1].textContent=r.t; a.children[2].textContent=r.s; a.addEventListener('click',()=>go(r)); li.appendChild(a); res.appendChild(li); }); if(!cur.length && q.value.trim()){ res.innerHTML='<li role="presentation" class="small" style="padding:.6rem .7rem">Nada encontrado. Tente outra palavra, como “pensão” ou “INSS”.</li>'; } res.hidden=!q.value.trim(); q.setAttribute('aria-expanded',String(!res.hidden)); if(si>=0) q.setAttribute('aria-activedescendant','qres-'+si); else q.removeAttribute('aria-activedescendant'); }
  function find(){ const terms=norm(q.value.trim()).split(/\s+/).filter(Boolean); si=-1; cur = terms.length? IDX.filter(r=>terms.every(w=>r.k.includes(w))).slice(0,8):[]; draw(); }
  function close(){ res.hidden=true; q.setAttribute('aria-expanded','false'); q.removeAttribute('aria-activedescendant'); }
  function go(r){ close(); q.blur(); if(r.g){ location.hash='#glossario'; setTimeout(()=>{gq.value=r.g; gq.dispatchEvent(new Event('input'));},40);} }
  q.addEventListener('input',find);
  q.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){si=Math.min(si+1,cur.length-1);draw();e.preventDefault();} else if(e.key==='ArrowUp'){si=Math.max(si-1,0);draw();e.preventDefault();} else if(e.key==='Escape'){close();} });
  document.getElementById('topSearch').addEventListener('submit',e=>{ e.preventDefault(); const r=cur[si>=0?si:0]; if(r){ location.hash='#'+r.id; go(r);} });
  document.addEventListener('click',e=>{ if(!e.target.closest('.search')) close(); });

  /* ao imprimir, abre todos os itens da página */
  addEventListener('beforeprint',()=>document.querySelectorAll('details').forEach(d=>{d.dataset.was=d.open;d.open=true;}));
  addEventListener('afterprint',()=>document.querySelectorAll('details').forEach(d=>{d.open=d.dataset.was==='true';}));

  /* saída rápida: troca a página sem deixar volta */
  const sr=document.getElementById('saidaRapida');
  if(sr) sr.addEventListener('click',()=>{ location.replace('https://www.google.com/search?q=previs%C3%A3o+do+tempo'); });
  /* Esc na busca só fecha os resultados; não aciona a saída rápida */
  addEventListener('keydown',e=>{ if(e.key==='Escape' && location.hash.startsWith('#mulheres') && !e.target.closest('.search')) sr && sr.click(); });

  route();
})();
