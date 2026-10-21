"""Hook PreToolUse: impede o Claude de ler ou alterar arquivos .env.

Eles vão guardar segredos (por exemplo, a senha de app do e-mail do formulário de contato).
O .env.example, que só tem valores de exemplo, continua liberado.
Sai com código 2 para bloquear: a mensagem volta para o Claude.
"""
import json
import re
import sys
from pathlib import Path

# ".env" ou ".env.algo" como palavra num comando de terminal, exceto ".env.example"
ENV_NO_COMANDO = re.compile(r"(?<![\w.-])\.env(?!\.example)(\.[\w-]+)?(?![\w.-])")

sys.stdin.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")


def main():
    dados = json.load(sys.stdin)
    entrada = dados.get("tool_input") or {}
    nome = Path(entrada.get("file_path") or "").name.lower()
    comando = entrada.get("command") or ""
    if ENV_NO_COMANDO.search(comando):
        nome = ".env"
    if nome == ".env" or (nome.startswith(".env.") and nome != ".env.example"):
        print(f"Bloqueado: {nome} guarda segredos e não deve ser lido nem alterado pelo Claude. "
              "Peça para a pessoa editar esse arquivo diretamente; use .env.example para documentar as variáveis.",
              file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
