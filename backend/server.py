from flask_cors import CORS
from flask import Flask, Response, request
from dotenv import dotenv_values
from pymongo import MongoClient
import certifi
from datetime import datetime
import json


app = Flask(__name__)
CORS(app)
config = dotenv_values("../.env")

@app.route('/')
def root():
    return "Hello World!"

# Gets the current date and returns the corresponding question.
@app.route('/today/get-question/')
def get_todays_question():
    
    client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
    db = client[config["DB_NAME"]]
    questions = db["questions"]  # Fixed collection name to match read_tables.py
    # Get today's date in the format stored in the database
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    # Find the question for today
    today_question = questions.find_one({"date": today})
    client.close()
    
    if today_question:
        # Convert ObjectId to string for JSON serialization
        today_question["_id"] = str(today_question["_id"])
        today_question["date"] = today_question["date"].strftime("%m-%d-%Y")
        return Response(json.dumps(today_question), mimetype="application/json")
    else:
        return Response(json.dumps({"error": "No question found for today"}), 
                       status=404, 
                       mimetype="application/json")


if __name__ == '__main__':
    app.debug = True
    app.run()
