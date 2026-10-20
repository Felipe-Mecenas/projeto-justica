
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
    const h1 = page.querySelector('h1'), moveFocus = !first; first = false;
    document.title = page === pages[0] ? baseTitle : h1.textContent + ' | ' + baseTitle;
    if (target && target.tagName === 'DETAILS') target.open = true;
    if (target && !target.dataset.page) setTimeout(() => { if (moveFocus) focusEl(target); target.scrollIntoView({block:'start'}); }, 30);
    else { window.scrollTo(0,0); if (moveFocus) focusEl(h1); }
  }
  addEventListener('hashchange', route);
  /* menu rola na horizontal: mantém o item focado pelo teclado inteiro na tela */
  navLinks.forEach(a => a.addEventListener('focus', () => a.scrollIntoView({block:'nearest', inline:'nearest'})));
  /* mostra setas nas bordas do menu enquanto houver itens fora da tela */
  const navEl = document.querySelector('nav.main'), navBox = navEl.querySelector('.wrap');
  function navEdges(){ const max = navBox.scrollWidth - navBox.clientWidth; navEl.classList.toggle('more-left', navBox.scrollLeft > 4); navEl.classList.toggle('more-right', navBox.scrollLeft < max - 4); }
  navBox.addEventListener('scroll', navEdges, {passive:true}); addEventListener('resize', navEdges); navEdges();

  /* ---------- questionário ---------- */
  const form = document.getElementById('quiz'), out = document.getElementById('resultado');
  const ajuda = ' Se não puder pagar advogado, procure a <a href="#defensoria">Defensoria Pública</a>.';
  function show(cls,t,h){ out.className='result '+cls; out.innerHTML='<strong>'+t+'</strong><p>'+h+'</p><p class="small">Informação educativa e orientativa sobre como a Justiça se organiza. Não avalia se você tem razão no seu caso.</p>'; }
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('change', () => {
    const f = new FormData(form), c=f.get('contra'), t=f.get('tipo'), v=f.get('valor');
    if (t==='fam') return show('no','Esse assunto não vai para o Juizado','Família e inventário vão para as Varas de Família e Sucessões, com advogado. A <a href="#defensoria">Defensoria do seu estado</a> atende esses casos.');
    if (t==='trab') return show('warn','Esse caso vai para a Justiça do Trabalho','A <a href="#justica-trabalho">Justiça do Trabalho</a> aceita pedido feito pelo próprio trabalhador, mas busque orientação antes: sindicato, Defensoria ou núcleo de prática jurídica.');
    if (!c||!t||!v) return;
    if (v==='ns') return show('warn','Primeiro, estime o valor','Some o prejuízo que você consegue comprovar (notas, recibos, orçamentos) e o que pretende pedir por dano moral. Depois volte à pergunta 3.');
    if (c==='pe'){ if(v==='20') return show('ok','Juizado Especial Cível, sem advogado','Você pode pedir sozinho, por <a href="#passos-atermacao">atermação</a>. A primeira fase é gratuita.'); if(v==='40') return show('warn','Juizado Especial Cível, com advogado','Acima de 20 salários mínimos, o Juizado exige advogado.'+ajuda); return show('warn','Justiça comum, com advogado','Acima de 40 salários mínimos, o caso vai para a Vara Cível. Você pode pedir justiça gratuita.'+ajuda); }
    if (c==='fz'){ if(v!=='mais') return show('ok','Juizado da Fazenda Pública, sem advogado','Você pode pedir sozinho na primeira fase. Atenção ao prazo de 5 anos. Veja <a href="#passos-estado">o que precisa provar</a>.'); return show('warn','Vara da Fazenda Pública, com advogado','Acima de 60 salários mínimos, precisa de advogado.'+ajuda); }
    if (c==='fed'){ if(v!=='mais') return show('ok','Juizado Especial Federal, sem advogado','Causas contra INSS, Caixa e órgãos federais até 60 salários mínimos. A <a href="#def-dpu">DPU</a> também pode ajudar.'); return show('warn','Justiça Federal, com advogado','Procure a <a href="#def-dpu">Defensoria Pública da União</a> se não puder pagar advogado.'); }
  });

  /* ---------- defensorias ---------- */
  const busca = n => 'https://www.google.com/search?q=' + encodeURIComponent('Defensoria Pública ' + n + ' site oficial');
  const ufs = [['DPU','Defensoria Pública da União (INSS, Caixa)','https://www.dpu.def.br/'],['AC','Acre','https://defensoria.ac.def.br/'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal','https://www.defensoria.df.gov.br/'],['ES','Espírito Santo'],['GO','Goiás','https://www.defensoriapublica.go.gov.br/'],['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']];
  const sel = document.getElementById('uf'), link = document.getElementById('ufLink');
  ufs.forEach(([k,n]) => sel.add(new Option(n,k)));
  function setUf(){ const u = ufs.find(x=>x[0]===sel.value); link.href = u[2] || busca(u[1]); link.innerHTML = (u[2] ? 'Abrir site oficial' : 'Buscar site oficial') + '<span class="sr"> (abre em nova aba)</span>'; }
  sel.addEventListener('change', setUf); setUf();

  /* ---------- checklist ---------- */
  const boxes=[...document.querySelectorAll('#checklist input')], st=document.getElementById('checkStatus');
  const stat=()=>{const n=boxes.filter(b=>b.checked).length; st.textContent = n===boxes.length?'Tudo em ordem. Continue acompanhando pelo site do tribunal.':'Você marcou '+n+' de '+boxes.length+'. Peça ao advogado o que falta: é seu direito.';};
  try{ const s=JSON.parse(localStorage.getItem('ja-check')||'[]'); boxes.forEach((b,i)=>b.checked=!!s[i]); }catch(e){}
  boxes.forEach(b=>b.addEventListener('change',()=>{ try{localStorage.setItem('ja-check',JSON.stringify(boxes.map(x=>x.checked)));}catch(e){} stat(); })); stat();

  /* ---------- copiar ---------- */
  const cb=document.getElementById('copyBtn'), cm=document.getElementById('copyMsg'), pt=document.getElementById('promptTxt');
  cb.addEventListener('click',()=>{ const fb=()=>{const r=document.createRange();r.selectNodeContents(pt);const s=getSelection();s.removeAllRanges();s.addRange(r);cm.textContent='Texto selecionado. Copie com o botão do seu aparelho.';}; try{navigator.clipboard.writeText(pt.innerText).then(()=>cm.textContent='Copiado.',fb);}catch(e){fb();} });

  /* ---------- glossário ---------- */
  const G=[['Medida protetiva','Ordem do juiz para proteger a mulher em situação de violência, como afastar o agressor.'],['Feminicídio','Matar uma mulher por ela ser mulher. Crime com pena de 20 a 40 anos.'],['Acesso à Justiça','A possibilidade de buscar proteção para um direito ou resolver um conflito pelos meios adequados.'],['Alvará','Autorização do juiz para sacar um valor depositado no processo.'],['Assistência jurídica gratuita','Orientação e defesa feitas de graça para quem não pode pagar, principalmente pela Defensoria Pública.'],['Atermação','Quando o servidor do Juizado escreve o pedido para você, a partir do seu relato.'],['Audiência de conciliação','Reunião para tentar um acordo, antes de o juiz decidir.'],['Autor','Quem entra com a ação.'],['Citação','Aviso oficial ao réu de que ele está sendo processado.'],['Comarca','A cidade ou região atendida por um fórum.'],['Competência','Qual juiz ou tribunal é o certo para julgar aquele tipo de caso.'],['Contestação','A defesa do réu.'],['Cumprimento de sentença','A fase de cobrar o que foi ganho.'],['Dano material','Prejuízo em dinheiro: conserto, conta paga, salário perdido.'],['Dano moral','Sofrimento, humilhação ou abalo causado a alguém.'],['Defensoria Pública','Instituição com advogados públicos que atendem de graça quem não pode pagar.'],['Desembargador','Julgador do tribunal de segunda instância.'],['Embargos de declaração','Pedido para o juiz esclarecer uma decisão confusa ou incompleta.'],['Fazenda Pública','O poder público quando está no processo: União, Estados, DF, Municípios.'],['Gratuidade da Justiça','Benefício que pode dispensar o pagamento das custas do processo. Quem decide é o juiz.'],['Hipossuficiência','Falta de condições financeiras para pagar o processo ou um advogado.'],['Honorários','O pagamento do advogado.'],['Instância','Cada degrau do processo: juiz, tribunal, tribunais superiores.'],['Intimação','Aviso oficial às partes sobre algo que aconteceu no processo.'],['Inventário','Procedimento para listar e dividir os bens de quem faleceu.'],['Ministério Público','Instituição que defende os interesses da sociedade e acusa nos crimes.'],['Nexo causal','A ligação direta entre o fato e o dano.'],['Petição inicial','O pedido escrito que começa o processo.'],['Prescrição','Perda do direito de processar porque o prazo passou.'],['Procuração','Documento que dá poderes ao advogado para agir em seu nome.'],['Prova','Tudo o que mostra que o fato aconteceu.'],['Recurso inominado','Recurso contra a sentença no Juizado. Exige advogado. Prazo de 10 dias.'],['Responsabilidade objetiva','Quando o Estado responde pelo dano mesmo sem culpa.'],['Réu','Contra quem a ação é movida.'],['Revelia','Quando o réu não se defende ou falta à audiência.'],['Sentença','A decisão do juiz que resolve o caso.'],['Trânsito em julgado','Quando não cabe mais recurso e a decisão vira definitiva.'],['Turma Recursal','Grupo de juízes que revê as sentenças dos Juizados.'],['Vara','A unidade do fórum onde trabalha um juiz.']];
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
    ['Acesso à Justiça, gratuidade e assistência','Três ideias diferentes','def-conceitos','gratuidade justiça gratuita assistência jurídica custas']
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
