"""Testes do site. Rodar na raiz do projeto: python -m unittest discover tests"""
import re
import unittest
from pathlib import Path

from app import create_app

RAIZ = Path(__file__).resolve().parents[1]
JS = (RAIZ / "app/static/js/main.js").read_text(encoding="utf-8")


class SiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app = create_app()
        app.testing = True
        resp = app.test_client().get("/")
        cls.status = resp.status_code
        cls.html = resp.get_data(as_text=True)
        # destinos possíveis de um link "#x": ids, páginas e as letras do glossário criadas pelo main.js
        cls.ids = set(re.findall(r'\bid="([^"]+)"', cls.html))
        cls.ids |= set(re.findall(r'data-page="([^"]+)"', cls.html))
        cls.ids |= {"g-" + chr(c) for c in range(ord("A"), ord("Z") + 1)}

    def test_pagina_abre(self):
        self.assertEqual(self.status, 200)

    def test_toda_pagina_tem_um_h1(self):
        blocos = re.split(r'<div data-page="', self.html)[1:]
        self.assertGreaterEqual(len(blocos), 13)
        for b in blocos:
            nome = b.split('"', 1)[0]
            self.assertIn("<h1", b.split('<div data-page="')[0], f"página {nome} sem h1")

    def test_links_internos_do_html_existem(self):
        for alvo in re.findall(r'href="#([^"]+)"', self.html):
            self.assertIn(alvo, self.ids, f"link #{alvo} no HTML não tem destino")

    def test_links_internos_do_js_existem(self):
        # links escritos no main.js: href="#x" nos textos e '#x' nos canais e no índice da busca
        alvos = set(re.findall(r'href="#([\w-]+)"', JS)) | set(re.findall(r"'#([\w-]+)'\]", JS))
        bloco_idx = JS.split("const IDX=[", 1)[1].split("].map", 1)[0]
        indice = re.findall(r"\['[^']+','[^']+','([\w-]+)','[^']*'\]", bloco_idx)
        self.assertGreater(len(indice), 30)
        for alvo in alvos | set(indice):
            self.assertIn(alvo, self.ids, f"link #{alvo} no main.js não tem destino")

    def test_menu_aponta_para_paginas_que_existem(self):
        for painel in re.findall(r'aria-controls="([^"]+)"', self.html):
            self.assertIn(f'id="{painel}"', self.html)

    def test_links_externos_seguros(self):
        for url in re.findall(r'href="(https?://[^"]+)"', self.html) + re.findall(r"'(https?://[^']+)'", JS):
            self.assertTrue(url.startswith("https://"), url)

    def test_nada_carregado_de_terceiros(self):
        # fontes e imagens vêm do próprio site (a política de privacidade promete isso)
        self.assertNotIn("fonts.googleapis.com", self.html)
        self.assertNotRegex(self.html, r'<(script|link|img)[^>]+(src|href)="https?://')

    def test_site_nao_tem_formulario_que_envia_dados(self):
        # nenhum questionário envia respostas ao servidor
        self.assertNotRegex(self.html, r'<form[^>]+(method|action)=')


if __name__ == "__main__":
    unittest.main()
