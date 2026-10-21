"""Testes num navegador de verdade: menu, questionários, teclado, celular.

Precisa do Playwright (pip install -r requirements-dev.txt) e do Google Chrome instalado.
Sem eles, os testes são pulados. Rodar: python -m unittest tests.test_navegador
"""
import logging
import threading
import unittest

from werkzeug.serving import make_server

from app import create_app

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None


@unittest.skipIf(sync_playwright is None, "Playwright não instalado (pip install -r requirements-dev.txt)")
class NavegadorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # servidor de verdade numa porta livre, numa thread, só durante os testes (sem log de cada pedido)
        logging.getLogger("werkzeug").setLevel(logging.ERROR)
        cls.srv = make_server("127.0.0.1", 0, create_app())
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.srv.server_port}/"
        cls.pw = sync_playwright().start()
        try:
            cls.browser = cls.pw.chromium.launch(channel="chrome")
        except Exception as e:  # Chrome não instalado
            cls.pw.stop(); cls.srv.shutdown()
            raise unittest.SkipTest(f"Google Chrome não encontrado: {e}")

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.pw.stop(); cls.srv.shutdown()

    def setUp(self):
        self.ctx = self.browser.new_context(viewport={"width": 1366, "height": 900})
        self.page = self.ctx.new_page()
        self.erros = []
        self.page.on("pageerror", lambda e: self.erros.append(str(e)))

    def tearDown(self):
        self.ctx.close()
        self.assertEqual(self.erros, [], "erros de JavaScript na página")

    def abrir(self, hash=""):
        self.page.goto(self.url + hash)
        return self.page

    # ---------- privacidade ----------
    def test_nada_carregado_de_terceiros(self):
        pedidos = []
        self.page.on("request", lambda r: pedidos.append(r.url))
        p = self.abrir(); p.wait_for_load_state("networkidle")
        self.assertEqual([u for u in pedidos if not u.startswith(self.url)], [])
        self.assertTrue(p.evaluate("""document.fonts.check('16px "Atkinson Hyperlegible"') && document.fonts.check('800 16px "Source Serif 4"')"""))

    # ---------- menu ----------
    def test_menu_com_mouse(self):
        p = self.abrir()
        p.click('button[aria-controls="m-fiscalize"]')
        self.assertTrue(p.is_visible("#m-fiscalize"))
        p.click('#m-fiscalize a[href="#mp"]')
        self.assertTrue(p.is_visible('[data-page="mp"]'))
        self.assertFalse(p.is_visible("#m-fiscalize"), "painel deve fechar ao navegar")
        self.assertIn("cur", p.get_attribute('li:has(> button[aria-controls="m-fiscalize"])', "class"))
        self.assertTrue(p.title().startswith("Ministério Público"))
        p.click('button[aria-controls="m-sobre"]')
        p.mouse.click(700, 880)  # ponto fora do painel
        self.assertFalse(p.is_visible("#m-sobre"), "clicar fora deve fechar")

    def test_menu_com_teclado(self):
        p = self.abrir()
        p.focus('button[aria-controls="m-entenda"]'); p.keyboard.press("Enter")
        self.assertTrue(p.is_visible("#m-entenda"))
        p.keyboard.press("Tab")
        self.assertTrue(p.evaluate("document.activeElement.closest('#m-entenda') !== null"), "Tab entra no painel")
        p.keyboard.press("Escape")
        self.assertFalse(p.is_visible("#m-entenda"))
        self.assertEqual(p.evaluate("document.activeElement.getAttribute('aria-controls')"), "m-entenda", "Esc devolve o foco ao botão")

    # ---------- seletores de órgão ----------
    def test_seletor_de_ministerio_publico(self):
        p = self.abrir("#mp")
        p.select_option("#mpuf", "SP")
        self.assertEqual(p.get_attribute("#mpLink", "href"), "https://www.mpsp.mp.br/")
        p.select_option("#mpuf", "PA")  # sem link confirmado: vira busca
        self.assertIn("google.com/search", p.get_attribute("#mpLink", "href"))
        self.assertIn("Buscar", p.text_content("#mpLink"))

    # ---------- questionário do Juizado ----------
    def test_juizado_sem_promessa_e_recomecar(self):
        p = self.abrir("#meucaso")
        p.check("#c-pe"); p.check("#t-ok"); p.check("#v1")
        r = p.text_content("#resultado")
        self.assertIn("Caminho possível", r); self.assertIn("pode ser pertinente", r)
        p.click("button[type=reset]")
        p.wait_for_function("document.getElementById('resultado').textContent.includes('Responda as três perguntas')")
        self.assertFalse(p.is_checked("#c-pe"))

    # ---------- questionário "Onde devo buscar ajuda?" ----------
    def test_guia_urgencia(self):
        p = self.abrir("#ondebuscar")
        self.assertEqual(p.locator('#guia [data-a="voltar"]').count(), 0, "1ª pergunta sem Voltar")
        p.click('#guia [data-v="sim"]')
        t = p.text_content("#guia")
        for trecho in ("190", "192", "193", "não substituem"):
            self.assertIn(trecho, t)
        self.assertEqual(p.evaluate("document.activeElement.tagName"), "H2", "foco vai ao título do passo")

    def test_guia_voltar_e_recomecar(self):
        p = self.abrir("#ondebuscar")
        p.click('#guia [data-v="nao"]'); p.click('#guia [data-v="adm"]'); p.click('#guia [data-v="fed"]')
        t = p.text_content("#guia")
        for trecho in ("Polícia Federal", "Ministério Público Federal", "Corregedoria", "não define qual órgão"):
            self.assertIn(trecho, t)
        p.click('#guia [data-a="voltar"]')
        self.assertIn("qual governo", p.text_content("#guia h2"))
        p.click('#guia [data-v="mun"]')
        t = p.text_content("#guia")
        self.assertIn("Polícia Civil", t); self.assertNotIn("Polícia Federal", t)
        p.click('#guia [data-a="recomecar"]')
        self.assertIn("perigo", p.text_content("#guia h2"))

    def test_guia_todos_os_caminhos(self):
        p = self.abrir("#ondebuscar")
        esferas = ["fed", "est", "mun", "ns"]
        caminhos = {"servico": esferas, "adm": esferas, "recursos": esferas, "coletivo": esferas,
                    "pessoas": ["mulher", "crianca", "idosa", "pcd"], "consumo": [None], "crime": [None], "ns": [None]}
        for tema, subs in caminhos.items():
            for sub in subs:
                with self.subTest(tema=tema, sub=sub):
                    p.reload()
                    p.click('#guia [data-v="nao"]'); p.click(f'#guia [data-v="{tema}"]')
                    if sub:
                        p.click(f'#guia [data-v="{sub}"]')
                    self.assertGreaterEqual(p.locator("#guia .canal").count(), 2)
        p.click('#guia a[href="#defensoria"]')
        self.assertTrue(p.is_visible('[data-page="defensoria"]'), "link interno do resultado abre a página")

    # ---------- busca ----------
    def test_busca_abre_item(self):
        p = self.abrir()
        p.fill("#q", "propina")
        self.assertIn("Pediram dinheiro", p.text_content("#qres"))
        p.keyboard.press("Enter")
        p.wait_for_function("document.getElementById('denuncie-vantagem').open", timeout=3000)

    # ---------- avisos ----------
    def test_privacidade_e_rodape(self):
        p = self.abrir("#privacidade")
        self.assertTrue(p.is_visible('[data-page="privacidade"] h1'))
        self.assertIn("não é um canal oficial de denúncias", p.text_content("footer"))

    # ---------- celular e ampliação ----------
    def test_celular(self):
        m = self.ctx.new_page(); m.set_viewport_size({"width": 375, "height": 800})
        m.goto(self.url)
        m.evaluate("document.querySelector('button[aria-controls=\"m-resolva\"]').scrollIntoView({inline:'center'})")
        m.click('button[aria-controls="m-resolva"]')
        caixa = m.locator("#m-resolva").bounding_box()
        self.assertTrue(caixa["x"] >= 0 and caixa["width"] <= 375, "painel cabe na tela")
        for h in ("", "#denuncie", "#mp", "#ondebuscar", "#privacidade"):
            m.goto(self.url + h)
            self.assertLessEqual(m.evaluate("document.documentElement.scrollWidth"), 375, f"rolagem lateral em {h or 'início'}")

    def test_texto_ampliado_200(self):
        p = self.abrir("#mp")
        p.evaluate("document.documentElement.style.fontSize = '200%'")
        self.assertLessEqual(p.evaluate("document.documentElement.scrollWidth"), 1366)


if __name__ == "__main__":
    unittest.main()
