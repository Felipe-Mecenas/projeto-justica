---
name: verificar-links
description: Testa todos os links oficiais do site (Defensorias, Ministérios Públicos, CGU, Fala.BR, Disque 100...), corrige os que mudaram e atualiza as datas de verificação.
disable-model-invocation: true
---

# Verificar os links oficiais

O site promete ao visitante que os links foram verificados numa data. Esta rotina mantém essa promessa.

## 1. Testar

```
.venv/Scripts/python.exe .claude/skills/verificar-links/checar_links.py
```

O script lê todos os `https://` de `app/templates/index.html` e `app/static/js/main.js` (ignora as buscas do Google montadas pelo `main.js`) e também testa os candidatos dos estados que hoje estão sem link (AL, PA, PI, RR).

## 2. Resolver cada problema

- **OK com "redireciona para"**: se o destino é o mesmo órgão, troque pelo endereço final.
- **CERTIFICADO**: o site responde, mas manda a cadeia de certificados incompleta. Navegadores aceitam; mantenha o link.
- **CONFERIR (403/429/503)**: costuma ser bloqueio anti-robô. Tente com `curl -L -A "Mozilla/5.0 ..."`. Se o domínio é oficial e responde no navegador, mantenha.
- **QUEBRADO, SEM RESPOSTA ou página de login**: procure o endereço novo **no próprio site do órgão** ou com WebSearch, priorizando gov.br, .mp.br, .def.br e .jus.br. Confirme que a página nova diz o que o site afirma (finalidade, horário, telefone).
  - Se encontrar: troque o link em todos os lugares onde aparece (use Grep).
  - Se não encontrar: **não invente**. Na lista `ufs` ou `mps` do `main.js`, remova a URL (o site passa a mostrar "Buscar site oficial"). Nas outras páginas, remova o link e deixe o nome do canal.
- **Estado candidato OK**: acrescente a URL na lista `mps` do `main.js` e tire o estado do dicionário `CANDIDATOS` do script e do comentário acima de `mps`.

Nunca publique um telefone ou horário que você não leu na página oficial.

## 3. Atualizar as datas

Troque a data antiga pela de hoje nestes lugares (procure a data antiga com Grep):
- `index.html`: "Links verificados em ..." (página Como denunciar) e a seção `#sobre-fontes`.
- `main.js`: comentários "links testados em ..." acima de `mps` e de `CANAIS`.

## 4. Conferir

```
.venv/Scripts/python.exe -m unittest discover tests
```

Termine com um resumo para a pessoa: quantos links estavam OK, o que mudou e o que ficou sem link e por quê.
