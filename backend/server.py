from flask_cors import CORS
from flask import Flask, Response, request

app = Flask(__name__)
CORS(app)

@app.route('/')
def root():
    return "Hello World!"


if __name__ == '__main__':
    app.debug = True
    app.run()
