# Justiça ao Alcance de Todos

Portal educativo, gratuito e independente que explica a Justiça brasileira em linguagem simples, para pessoas leigas e em situação de vulnerabilidade. Não é órgão público, não presta consultoria jurídica e não recebe denúncias. A pessoa responsável conversa em português: responda em português.

## Como o código funciona

- Flask com uma única rota (`app/routes/main.py`) que entrega `app/templates/index.html`.
- **O site inteiro é uma página só.** Cada "página" é um `<div data-page="ID" hidden>`; o `main.js` mostra uma de cada vez conforme o `#ID` do endereço e abre o `<details>` quando o `#` aponta para um. Links internos são sempre `href="#id"`, nunca rotas novas no Flask.
- `app/static/js/main.js` guarda os dados: listas `ufs` (Defensorias) e `mps` (Ministérios Públicos), `CANAIS` e `PASSOS` do questionário "Onde devo buscar ajuda?", `G` (glossário) e `IDX` (índice da busca). Página ou seção nova precisa de entrada no `IDX`.
- Menu em 5 áreas: botões `.grp` que abrem painéis `.panel` (`#m-entenda`, `#m-resolva`, `#m-direitos`, `#m-fiscalize`, `#m-sobre`).
- CSS com variáveis em `:root` (azul-marinho `--navy`, dourado `--gold`). Títulos em Source Serif 4, texto em Atkinson Hyperlegible; o "0" vem da fonte "Zero Normal" (a Atkinson risca o zero e a pessoa não quer isso).

## Regras que não podem ser quebradas

- **Nada de terceiros na página**: fontes, imagens e scripts são servidos pelo próprio site. A página Privacidade promete isso, e `tests/test_site.py` confere.
- **Nada é salvo nem enviado**: questionários rodam no navegador. A única coisa guardada é o checklist do advogado, no localStorage. Qualquer mudança nisso exige atualizar antes a página `#privacidade`.
- **Conteúdo jurídico não se inventa.** Lei, prazo, valor, telefone, horário ou órgão só entram com fonte oficial lida na sessão (planalto.gov.br, gov.br, .mp.br, .def.br, .jus.br). Na dúvida, deixe de fora e avise.
- **Sem promessas**: "pode", "costuma", "em regra", "pode ser pertinente". Nunca "garantido", "você tem direito" ou "o único órgão".
- **Link oficial não confirmado não é publicado**: nas listas `ufs`/`mps`, deixe sem URL e o site mostra "Buscar site oficial".
- Páginas que orientam o que fazer terminam com `<p class="aviso">` e com a linha "Fontes: ... Revisado em ...".
- Acessibilidade (WCAG 2.2 AA): contraste de texto ≥ 4,5:1, bordas de campos ≥ 3:1, tudo operável por teclado, link externo com `target="_blank" rel="noopener"` e `<span class="sr"> (abre em nova aba)</span>`.

## Comandos

- Rodar: `.venv/Scripts/python.exe run.py` (http://127.0.0.1:5000). Se a porta 5000 já estiver ocupada por um servidor antigo, use outra porta: `create_app().run(port=5055)`.
- Testes rápidos (links, títulos, terceiros): `.venv/Scripts/python.exe -m unittest tests.test_site`
- Testes no navegador (~1 min; precisam do Chrome e de `pip install -r requirements-dev.txt`): `.venv/Scripts/python.exe -m unittest tests.test_navegador`
- Todos: `.venv/Scripts/python.exe -m unittest discover tests`

## Automações deste projeto

- Hook pós-edição (`.claude/hooks/checar_sintaxe.py`): confere a sintaxe, se o site abre e, para `.html`/`.js`, roda `tests.test_site`.
- Hook pré-uso (`.claude/hooks/proteger_env.py`): bloqueia leitura e edição de `.env` (vai guardar a senha do e-mail do contato). O `.env.example` é liberado.
- `/verificar-links`: testa e atualiza os links oficiais e as datas de verificação.
- `/nova-pagina <assunto>`: cria uma página ligada ao menu, à busca e aos testes.
- Agente `revisor-juridico`: revisa texto novo antes de publicar.

## Pendências conhecidas

- Formulário de contato: aguardando o e-mail próprio do projeto. Usar SMTP com credenciais em variáveis de ambiente, sem dependências novas.
- Hospedagem não definida. Código no GitHub, repositório privado: https://github.com/Felipe-Mecenas/projeto-justica (branch `master`).
- MPs de AL, PA, PI e RR sem link confirmado (os sites não responderam nos testes).
