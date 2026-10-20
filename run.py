import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    # Modo debug só no seu computador. Para ligar: set FLASK_DEBUG=1 (Windows)
    # Na internet ele deve ficar desligado.
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(debug=debug)
