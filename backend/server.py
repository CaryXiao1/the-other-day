from flask_cors import CORS
from flask import Flask, Response, request
from dotenv import dotenv_values
from pymongo import MongoClient
import certifi
from datetime import datetime, timedelta
import json


app = Flask(__name__)
CORS(app)
config = dotenv_values("./.env")

@app.route('/')
def root():
    return "Hello World!"

# Gets the current date and returns the corresponding question.
@app.route('/today/get-question/')
def get_todays_question():
    
    client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
    db = client[config["DB_NAME"]]
    questions = db["questions"]
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

# Gets yesterday's date and returns the corresponding question.
@app.route('/yesterday/get-question/')
def get_yesterdays_question():
    
    client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
    db = client[config["DB_NAME"]]
    questions = db["questions"]
    # Get yesterday's date in the format stored in the database
    yesterday = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
    # Find the question for yesterday
    yesterday_question = questions.find_one({"date": yesterday})
    client.close()
    
    if yesterday_question:
        # Convert ObjectId to string for JSON serialization
        yesterday_question["_id"] = str(yesterday_question["_id"])
        yesterday_question["date"] = yesterday_question["date"].strftime("%m-%d-%Y")
        return Response(json.dumps(yesterday_question), mimetype="application/json")
    else:
        return Response(json.dumps({"error": "No question found for yesterday"}), 
                       status=404, 
                       mimetype="application/json")

# Get user details by user_id
@app.route('/user/<user_id>')
def get_user(user_id):
    try:
        from bson.objectid import ObjectId
        
        # Convert the string ID to ObjectId
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        # Find the user by ObjectId
        user = users.find_one({"_id": object_id})
        client.close()
        
        if user:
            # Convert ObjectId to string for JSON serialization
            user["_id"] = str(user["_id"])
            return Response(json.dumps(user), mimetype="application/json")
        else:
            return Response(json.dumps({"error": "User not found"}), 
                          status=404, 
                          mimetype="application/json")
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), 
                      status=500, 
                      mimetype="application/json")

@app.route('/user/<user_id>/top-answers')
def get_top_answers(user_id):
    try:
        # Convert string ID to ObjectId
        from bson.objectid import ObjectId
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers = db["answers"]
        questions = db["questions"]
        
        # Get the user's top 5 answers sorted by votes (descending)
        user_answers = list(answers.find({"user_id": object_id}).sort("votes", -1))   
        user_answers = user_answers[:5] 
        # Enrich answers with question text
        result = []
        
        for answer in user_answers:
            question_id = answer.get("question_id")
            if not isinstance(question_id, ObjectId):
                # Convert to ObjectId if it's not already
                question_id = ObjectId(question_id)
                
            question = questions.find_one({"_id": question_id})
            if question:
                answer["_id"] = str(answer["_id"])
                answer["question_id"] = str(answer["question_id"])
                answer["user_id"] = str(answer["user_id"])
                # Add question text to the answer
                answer["question_text"] = question["question"]
                answer["date"] = question["date"].strftime("%m-%d-%Y")
                result.append(answer)
        
        client.close()
        
        return Response(json.dumps(result), mimetype="application/json")
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), 
                      status=500, 
                      mimetype="application/json")

# Get user global ranking
@app.route('/user/<user_id>/ranking')
def get_user_ranking(user_id):
    try:
        # Convert string ID to ObjectId
        from bson.objectid import ObjectId
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        all_users = list(users.find().sort("total_points", -1))
        
        # Find the user's position in the ranking
        user_rank = None
        total_users = len(all_users)
        
        for i, user in enumerate(all_users):
            if user["_id"] == object_id:
                user_rank = i + 1  # Add 1 because ranks start at 1, not 0
                break
        
        client.close()
        
        if user_rank:
            return Response(
                json.dumps({
                    "user_id": user_id,
                    "rank": user_rank,
                    "total_users": total_users
                }),
                mimetype="application/json"
            )
        else:
            return Response(json.dumps({"error": "User not found"}), 
                          status=404, 
                          mimetype="application/json")
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), 
                      status=500, 
                      mimetype="application/json")

# Add a new user during registration
@app.route('/user/register', methods=['POST'])
def register_user():
    try:
        # Get user data from request body
        user_data = request.json
        
        # Validate required fields
        #TODO: add in email support later
        # required_fields = ['username', 'email']
        required_fields = ['username']
        for field in required_fields:
            if field not in user_data:
                return Response(json.dumps({
                    "error": f"Missing required field: {field}"
                }), status=400, mimetype="application/json")
        
        # Connect to database
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        # Check if username or email already exists
        existing_user = users.find_one({
            "$or": [
                {"username": user_data['username']},
                # {"email": user_data['email']}
            ]
        })
        
        if existing_user:
            client.close()
            return Response(json.dumps({
                "error": "Username or email already in use"
            }), status=409, mimetype="application/json")
        
        # Prepare user document
        new_user = {
            "username": user_data['username'],
            # "email": user_data['email'],
            "total_points": 0,
        }
        
        # Add optional fields if provided
        if 'name' in user_data:
            new_user['name'] = user_data['name']
        
        if 'avatar_url' in user_data:
            new_user['avatar_url'] = user_data['avatar_url']
        
        # Insert new user
        result = users.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Close connection
        client.close()
        
        return Response(json.dumps({
            "message": "User created successfully",
            "user_id": user_id
        }), status=201, mimetype="application/json")
        
    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

# Get global leaderboard
@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        # Get limit parameter (default to 10)
        limit = int(request.args.get('limit', 10))
        
        # Connect to database
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        leaderboard_users = list(users.find(
            {},
            {"username": 1, "total_points": 1, "avatar_url": 1, "name": 1}
        ).sort("total_points", -1).limit(limit))
        
        # Format the response
        result = []
        for index, user in enumerate(leaderboard_users):
            user_data = {
                "user_id": str(user["_id"]),
                "username": user["username"],
                "total_points": user["total_points"],
                "rank": index + 1  # Add 1 because ranks start at 1, not 0
            }
            
            # Add optional fields if they exist
            if "name" in user:
                user_data["name"] = user["name"]
            if "avatar_url" in user:
                user_data["avatar_url"] = user["avatar_url"]
                
            result.append(user_data)
        
        client.close()
        
        return Response(json.dumps({
            "leaderboard": result,
            "total_users": len(result)
        }), mimetype="application/json")
        
    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")


@app.route('/question/<question_id>/get_pair', methods=['GET'])
def get_pair(question_id):
    try:
        from bson.objectid import ObjectId

        object_id = ObjectId(question_id)

        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers = db["answers"]
        questions = db["questions"]

        # Find the question
        question = questions.find_one({"_id": object_id})
        if not question:
            client.close()
            return Response(json.dumps({"error": "Question not found"}), status=404, mimetype="application/json")

        # Sample two random answers for the given question_id
        random_answers = list(answers.aggregate([
            {"$match": {"question_id": object_id}},
            {"$sample": {"size": 2}}
        ]))

        enriched_answers = []
        for answer in random_answers:
            answer["_id"] = str(answer["_id"])
            answer["question_id"] = str(answer["question_id"])
            answer["user_id"] = str(answer["user_id"])

            answer["question_text"] = question["question"]
            answer["date"] = question["date"].strftime("%m-%d-%Y")

            enriched_answers.append(answer)

        client.close()
        return Response(json.dumps(enriched_answers), mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype="application/json")

@app.route('/answer/<answer_id>/increment-appearance', methods=['POST'])
def increment_appearance_count(answer_id):
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers = db["answers"]

        from bson.objectid import ObjectId
        object_id = ObjectId(answer_id)

        # Increment the 'appearances' field by 1 (create it if it doesn't exist)
        result = answers.update_one(
            {"_id": object_id},
            {"$inc": {"appearances": 1}}
        )

        client.close()

        if result.matched_count == 0:
            return Response(json.dumps({"error": "Answer not found"}), status=404, mimetype="application/json")
        
        return Response(json.dumps({"message": "Appearance count incremented"}), mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype="application/json")
    
@app.route('/answer/<answer_id>/increment-vote', methods=['POST'])
def increment_vote_count(answer_id):
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers = db["answers"]

        from bson.objectid import ObjectId
        object_id = ObjectId(answer_id)

        # Increment the 'votes' field by 1 (create it if it doesn't exist)
        result = answers.update_one(
            {"_id": object_id},
            {"$inc": {"votes": 1}}
        )

        client.close()

        if result.matched_count == 0:
            return Response(json.dumps({"error": "Answer not found"}), status=404, mimetype="application/json")
        
        return Response(json.dumps({"message": "Vote count incremented"}), mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype="application/json")
    
@app.route('/question/<question_id>/answer_leaderboard', methods=['GET'])
def get_answer_leaderboard(question_id):
    try:
        from bson.objectid import ObjectId
        object_id = ObjectId(question_id)

        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers_col = db["answers"]
        users_col = db["users"]

        # Fetch all answers for the question
        answer_cursor = answers_col.find({"question_id": object_id})

        enriched_answers = []

        for answer in answer_cursor:
            votes = answer.get("votes", 0)
            appearances = answer.get("appearances", 1)
            appearances = max(appearances, 1)
            ratio = votes / appearances

            answer_id = str(answer["_id"])
            user_id = answer.get("user_id")

            # Convert fields for JSON serialization
            answer["_id"] = answer_id
            answer["question_id"] = str(answer["question_id"])
            answer["user_id"] = str(user_id)

            user_info = users_col.find_one({"_id": ObjectId(user_id)})
            if user_info:
                user_info["_id"] = str(user_info["_id"])
            else:
                user_info = {"_id": str(user_id), "username": "Unknown"}

            enriched_answers.append({
                "answer": answer,
                "user": user_info,
                "ratio": ratio
            })

        client.close()

        # Sort the enriched list by ratio descending
        sorted_output = sorted(enriched_answers, key=lambda x: x["ratio"], reverse=True)

        # Drop ratio from final output
        result = [{"answer": item["answer"], "user": item["user"]} for item in sorted_output]

        return Response(json.dumps(result), mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype="application/json")

    
if __name__ == '__main__':
    app.debug = True
    app.run()
