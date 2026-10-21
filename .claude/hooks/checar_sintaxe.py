"""Hook PostToolUse: confere a sintaxe depois que o Claude edita um arquivo.

- .js   -> node --check
- .py   -> py_compile
- .py, .html (templates) -> carrega "/" pelo test client do Flask e exige 200
- .html, .js -> roda tests/test_site.py (links internos, h1 de cada página, nada de terceiros)

Se algo falhar, sai com código 2: o erro volta para o Claude corrigir.
"""
import json
import os
import py_compile
import subprocess
import sys
from pathlib import Path

sys.stdin.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

RAIZ = Path(__file__).resolve().parents[2]


def main():
    dados = json.load(sys.stdin)
    caminho = (dados.get("tool_input") or {}).get("file_path")
    if not caminho:
        return 0
    arq = Path(caminho).resolve()
    try:
        arq.relative_to(RAIZ / "app")
    except ValueError:
        if arq != RAIZ / "run.py":
            return 0

    erros = []
    if arq.suffix == ".js":
        r = subprocess.run(["node", "--check", str(arq)], capture_output=True, text=True, encoding="utf-8")
        if r.returncode:
            erros.append(f"Erro de sintaxe em {arq.name}:\n{r.stderr.strip()}")
    elif arq.suffix == ".py":
        try:
            py_compile.compile(str(arq), doraise=True)
        except py_compile.PyCompileError as e:
            erros.append(f"Erro de sintaxe em {arq.name}:\n{e.msg}")

    if not erros and arq.suffix in (".py", ".html"):
        sys.path.insert(0, str(RAIZ))
        os.chdir(RAIZ)
        try:
            from app import create_app

            app = create_app()
            app.testing = True  # propaga a exceção em vez de logar o traceback inteiro
            resp = app.test_client().get("/")
            if resp.status_code != 200:
                erros.append(f"GET / devolveu {resp.status_code} depois de editar {arq.name}.")
        except Exception as e:  # erro de Jinja, import quebrado etc.
            erros.append(f"O site não carregou depois de editar {arq.name}:\n{type(e).__name__}: {e}")

    # link interno quebrado não dá erro nenhum no navegador; só o teste pega
    if not erros and arq.suffix in (".html", ".js"):
        r = subprocess.run([sys.executable, "-m", "unittest", "tests.test_site"], cwd=RAIZ,
                           capture_output=True, text=True, encoding="utf-8")
        if r.returncode:
            erros.append(f"Os testes do site falharam depois de editar {arq.name}:\n{r.stderr.strip()[-2000:]}")

    if erros:
        print("\n\n".join(erros), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
