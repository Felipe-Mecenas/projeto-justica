---
name: nova-pagina
description: Cria uma página nova no site (ex. Direitos das pessoas idosas), ligando-a ao menu, à busca, à página inicial e aos testes, no padrão das páginas existentes.
disable-model-invocation: true
argument-hint: "[assunto da página]"
---

# Nova página: $ARGUMENTS

O site é uma página só: cada "página" é um `<div data-page="ID" hidden>` dentro de `app/templates/index.html`, mostrado pelo `main.js` conforme o `#ID` do endereço. Uma página nova mexe em vários arquivos. Siga a lista inteira.

## Antes de escrever

1. Defina com a pessoa: o **ID** (curto, sem acento, ex. `idosos`), a **área do menu** (Entenda a Justiça, Resolva seu problema, Conheça seus direitos, Fiscalize e denuncie, Sobre) e as **fontes oficiais** que embasam o texto.
2. Conteúdo jurídico novo **não pode ser inventado**. Cada afirmação sobre lei, prazo, valor, telefone ou órgão precisa de fonte: lei no planalto.gov.br ou página oficial lida por você nesta sessão. O que não puder confirmar fica de fora ou vai marcado como pendente de revisão para a pessoa.
3. Linguagem: frases curtas, sem juridiquês (quando um termo técnico for necessário, explique na hora ou acrescente ao glossário `G` do `main.js`). Nada de promessas: use "pode", "costuma", "em regra"; nunca "garantido", "você tem direito com certeza" ou "o único órgão".

## Lista de alterações

1. **Página** em `index.html`, antes de `</main>`, a partir de `modelo.html` desta pasta. Mantenha: `pagehead` com trilha (`crumb`) e um único `<h1>`; títulos `<h2 class="secth" id="ID-parte">` com ids para a busca achar; `<p class="aviso">` no fim se a página orienta o que fazer; linha "Fontes: ... Revisado em <mês> de <ano>".
2. **Menu**: um `<li><a href="#ID">Título<small>subtítulo curto</small></a></li>` no painel da área (`#m-entenda`, `#m-resolva`, `#m-direitos`, `#m-fiscalize` ou `#m-sobre`).
3. **Busca**: entradas no array `IDX` do `main.js`, no formato `['Título','Subtítulo','id-destino','palavras que as pessoas digitariam']`. Uma para a página e uma para cada seção importante.
4. **Página inicial**: se for um tema de entrada, um cartão `<a class="act">` na Central de Ajuda (mantenha o total múltiplo de 3 para a grade fechar).
5. **Rodapé**: só se for página de entrada importante.
6. **Links externos**: só endereços oficiais testados (use `curl -L` ou o script da skill verificar-links), sempre com `target="_blank" rel="noopener"` e `<span class="sr"> (abre em nova aba)</span>` no texto.
7. **Privacidade**: se a página guardar ou enviar qualquer dado, atualize a página `#privacidade` antes.

## Conferir

```
.venv/Scripts/python.exe -m unittest discover tests
```

O teste `test_toda_pagina_tem_um_h1` exige um número mínimo de páginas: aumente esse número em `tests/test_site.py` ao criar a página. Depois rode o agente `revisor-juridico` sobre o texto novo e mostre à pessoa o que ele apontou.
