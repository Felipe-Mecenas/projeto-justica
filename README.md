# Justiça ao Alcance de Todos

Portal educativo, gratuito e independente que explica a Justiça brasileira em linguagem simples.

## Rodar no computador

```
python -m venv .venv
.venv\Scripts\activate          (Windows)
pip install -r requirements.txt
python run.py
```

Abra http://127.0.0.1:5000. Para ligar o modo debug só no seu computador: `set FLASK_DEBUG=1` antes de `python run.py`. Na internet ele deve ficar desligado.

## Testes

```
python -m unittest tests.test_site        rápidos (menos de 1 segundo)
python -m unittest tests.test_navegador   num navegador de verdade (cerca de 1 minuto)
python -m unittest discover tests         todos
```

- `test_site`: confere se o site abre, se toda página tem título, se todo link interno (no HTML e no `main.js`) tem destino, se os links externos usam https e se nada é carregado de outros sites.
- `test_navegador`: menu com mouse e teclado, os dois questionários (todos os caminhos), busca, seletor de Ministério Público, celular e texto ampliado. Precisa do Google Chrome e de `pip install -r requirements-dev.txt`; sem eles, é pulado.

## Automações do Claude Code

Configuradas em `.claude/` e descritas no `CLAUDE.md`: hook que roda os testes após cada edição, hook que protege o `.env`, os comandos `/verificar-links` e `/nova-pagina` e o agente `revisor-juridico`. O Playwright MCP (`.mcp.json`) espera o pacote instalado na máquina: `npm i -g @playwright/mcp@0.0.83`.

## Como o site é organizado

- `app/templates/index.html`: todas as páginas, cada uma num `<div data-page="...">`. O `main.js` mostra uma de cada vez conforme o endereço (`#mp`, `#denuncie`...).
- `app/static/js/main.js`: menu, busca, questionários, glossário, listas de Defensorias e Ministérios Públicos e os canais do questionário "Onde devo buscar ajuda?".
- `app/static/css/style.css`: visual.
- `app/static/fonts/`: fontes servidas pelo próprio site (licenças em `LICENCAS.txt`).

## Manutenção do conteúdo

- Links oficiais ficam em `main.js` (listas `ufs`, `mps` e `CANAIS`) e nas páginas Ministério Público e Como denunciar. Ao trocar um link, teste-o e atualize a data de verificação nessas páginas e em "Fontes e atualização".
- Um estado sem link na lista abre uma busca em vez de um endereço não confirmado.
- Nenhum questionário guarda ou envia respostas. Se isso mudar, atualize antes a página Privacidade.

## Pendente

- Formulário de contato (aguardando o e-mail próprio do projeto). A página Privacidade já avisa que ele ainda não existe.
- Hospedagem ainda não definida.
