"""Testa todos os links externos do site e os candidatos dos estados ainda sem link.

Uso (na raiz do projeto): .venv/Scripts/python.exe .claude/skills/verificar-links/checar_links.py
Saída: uma linha por link, com o resultado; código 1 se algum link precisar de atenção.
"""
import re
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
RAIZ = Path(__file__).resolve().parents[3]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
# links que não são de órgãos (buscas montadas pelo main.js, Sair rápido, licenças)
IGNORAR = ("google.com/search", "openfontlicense.org", "github.com")
# Ministérios Públicos que estão sem link no main.js porque não responderam no último teste
CANDIDATOS = {"AL": "https://www.mpal.mp.br/", "PA": "https://www2.mppa.mp.br/", "PI": "https://www.mppi.mp.br/", "RR": "https://www.mprr.mp.br/"}


def links_do_site():
    textos = [(RAIZ / "app/templates/index.html").read_text(encoding="utf-8"),
              (RAIZ / "app/static/js/main.js").read_text(encoding="utf-8")]
    achados = set()
    for t in textos:
        achados |= set(re.findall(r"https?://[^\s\"'<>)]+", t))
    return sorted(u for u in achados if not any(i in u for i in IGNORAR))


def testar(url, conferir_certificado=True):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR"})
    ctx = None if conferir_certificado else ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            corpo = r.read(200_000).decode("utf-8", "replace")
            titulo = re.search(r"<title[^>]*>([^<]*)", corpo, re.I)
            final = r.geturl()
            nota = f"redireciona para {final}" if final.rstrip("/") != url.rstrip("/") else ""
            # páginas de login no lugar do conteúdo indicam que o endereço mudou
            if "require_login" in final or "login" in final.lower():
                return url, "ATENÇÃO", f"caiu numa página de login: {final}"
            return url, "OK", " ".join(filter(None, [(titulo.group(1).strip()[:70] if titulo else ""), nota]))
    except urllib.error.HTTPError as e:
        if e.code in (403, 429, 503):
            return url, "CONFERIR", f"HTTP {e.code}: provável bloqueio anti-robô; abra no navegador"
        return url, "QUEBRADO", f"HTTP {e.code}"
    except urllib.error.URLError as e:
        # vários sites públicos mandam a cadeia de certificados incompleta: o navegador completa, o Python não
        if conferir_certificado and isinstance(e.reason, ssl.SSLCertVerificationError):
            u, st, info = testar(url, conferir_certificado=False)
            return u, ("CERTIFICADO" if st == "OK" else st), "responde, mas a cadeia de certificados está incompleta (navegadores costumam aceitar). " + info
        return url, "SEM RESPOSTA", type(e).__name__ + ": " + str(e)[:80]
    except Exception as e:
        return url, "SEM RESPOSTA", type(e).__name__ + ": " + str(e)[:80]


def main():
    links = links_do_site()
    with ThreadPoolExecutor(max_workers=8) as ex:
        site = list(ex.map(testar, links))
        candidatos = list(ex.map(testar, CANDIDATOS.values()))
    print(f"== Links do site ({len(site)}) ==")
    for url, st, info in sorted(site, key=lambda x: x[1] == "OK"):
        print(f"{st:12} {url}  {info}")
    print("\n== Estados sem link (candidatos) ==")
    for (uf, _), (url, st, info) in zip(CANDIDATOS.items(), candidatos):
        print(f"{uf}: {st:12} {url}  {info}")
    problemas = [s for s in site if s[1] not in ("OK", "CERTIFICADO")]
    print(f"\n{len(site) - len(problemas)} OK, {len(problemas)} para olhar.")
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
