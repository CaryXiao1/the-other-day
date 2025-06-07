from flask_cors import CORS
from flask import Flask, Response, request
from dotenv import dotenv_values
from pymongo import MongoClient
import certifi
from datetime import datetime, timedelta
import json
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)
config = dotenv_values("./.env")

def serialize_document(doc):
    """Helper function to serialize MongoDB documents for JSON response"""
    if doc is None:
        return None

    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.strftime("%m-%d-%Y")
    
    return doc

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

@app.route('/today/has-answered/<user_id>')
def has_answered_today(user_id):
    try:
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        questions = db["questions"]
        answers = db["answers"]
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_question = questions.find_one({"date": today})
        if not today_question:
            client.close()
            return Response(json.dumps({
                "has_answered": False,
                "error": "No question found for today"
            }), status=404, mimetype="application/json")
        
        existing_answer = answers.find_one({
            "user_id": object_id,
            "question_id": today_question["_id"]
        })
        
        client.close()
        
        return Response(json.dumps({
            "has_answered": existing_answer is not None
        }), mimetype="application/json")
        
    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

# Gets yesterday's date and returns the corresponding question.
@app.route('/yesterday/get-question/')
def get_yesterdays_question():
    
    client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
    db = client[config["DB_NAME"]]
    questions = db["questions"]
    yesterday = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
    yesterday_question = questions.find_one({"date": yesterday})
    client.close()
    
    if yesterday_question:
        yesterday_question["_id"] = str(yesterday_question["_id"])
        yesterday_question["date"] = yesterday_question["date"].strftime("%m-%d-%Y")
        return Response(json.dumps(yesterday_question), mimetype="application/json")
    else:
        return Response(json.dumps({"error": "No question found for yesterday"}), 
                       status=404, 
                       mimetype="application/json")

@app.route('/day-before-yesterday/get-question/')
def get_day_before_yesterdays_question():
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        questions = db["questions"]
        # get day before yesterday's date (2 days ago)
        day_before_yesterday = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=2)

        question = questions.find_one({"date": day_before_yesterday})
        client.close()
        
        if question:
            question["_id"] = str(question["_id"])
            question["date"] = question["date"].strftime("%m-%d-%Y")
            return Response(json.dumps(question), mimetype="application/json")
        else:
            return Response(json.dumps({"error": "No question found for day before yesterday"}), 
                           status=404, 
                           mimetype="application/json")
    except Exception as e:
        print(f"ERROR in day-before-yesterday endpoint: {e}")
        return Response(json.dumps({"error": str(e)}), 
                       status=500, 
                       mimetype="application/json")
    
@app.route('/test-db')
def test_db():
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        collections = db.list_collection_names()
        client.close()
        return {"message": "Database connection successful", "collections": collections}
    except Exception as e:
        return {"error": f"Database connection failed: {str(e)}"}, 500
    
# Get user details by user_id
@app.route('/user/<user_id>')
def get_user(user_id):
    try:
        from bson.objectid import ObjectId
        
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        user = users.find_one({"_id": object_id})
        client.close()
        
        if user:
            user = serialize_document(user)
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
        from bson.objectid import ObjectId
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers = db["answers"]
        questions = db["questions"]
        
        # Get the user's top 5 answers sorted by votes (descending)
        user_answers = list(answers.find({"user_id": object_id}).sort("votes", -1))   
        user_answers = user_answers[:5] 

        result = []
        
        for answer in user_answers:
            question_id = answer.get("question_id")
            if not isinstance(question_id, ObjectId):
                question_id = ObjectId(question_id)
                
            question = questions.find_one({"_id": question_id})
            if question:
                clean_answer = {
                    "_id": str(answer["_id"]),
                    "question_id": str(answer["question_id"]),
                    "user_id": str(answer["user_id"]),
                    "answer_text": answer.get("answer_text", ""),
                    "votes": answer.get("votes", 0),
                    "appearances": answer.get("appearances", 0),
                    "question_text": question["question"],
                    "date": question["date"].strftime("%m-%d-%Y")
                }
                result.append(clean_answer)
        
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
        from bson.objectid import ObjectId
        object_id = ObjectId(user_id)
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        all_users = list(users.find().sort("total_points", -1))
        
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
        user_data = request.json

        required_fields = ['username', 'password']
        for field in required_fields:
            if field not in user_data:
                return Response(json.dumps({
                    "error": f"Missing required field: {field}"
                }), status=400, mimetype="application/json")
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]

        existing_user = users.find_one({"username": user_data['username']})
        
        if existing_user:
            client.close()
            return Response(json.dumps({
                "error": "Username already in use"
            }), status=409, mimetype="application/json")
        
        hashed_password = generate_password_hash(user_data['password'])
        new_user = {
            "username": user_data['username'],
            "password": hashed_password,
            "total_points": 0,
            "created_at": datetime.utcnow(),
            "groups": []
        }
        
        if 'name' in user_data:
            new_user['name'] = user_data['name']
        
        if 'avatar_url' in user_data:
            new_user['avatar_url'] = user_data['avatar_url']
        
        result = users.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        client.close()
        print("got here 4")
        print(user_data['username'])
        
        return Response(json.dumps({
            "message": "User created successfully",
            "user_id": user_id
        }), status=201, mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

# Authenticate user
@app.route('/user/login', methods=['POST'])
def login_user():
    try:
        login_data = request.json
        
        required_fields = ['username', 'password']
        for field in required_fields:
            if field not in login_data:
                return Response(json.dumps({
                    "error": f"Missing required field: {field}"
                }), status=400, mimetype="application/json")
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]

        user = users.find_one({"username": login_data['username']})
        
        if not user:
            client.close()
            return Response(json.dumps({
                "error": "Invalid username or password"
            }), status=401, mimetype="application/json")
        
        if not check_password_hash(user['password'], login_data['password']):
            client.close()
            return Response(json.dumps({
                "error": "Invalid username or password"
            }), status=401, mimetype="application/json")
        
        user_data = {
            "user_id": str(user["_id"]),
            "username": user["username"],
            "total_points": user.get("total_points", 0)
        }

        if "name" in user:
            user_data["name"] = user["name"]
        if "avatar_url" in user:
            user_data["avatar_url"] = user["avatar_url"]
        
        client.close()
        
        return Response(json.dumps({
            "message": "Login successful",
            "user": user_data
        }), mimetype="application/json")
        
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
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        
        leaderboard_users = list(users.find(
            {},
            {"username": 1, "total_points": 1, "avatar_url": 1, "name": 1}
        ).sort("total_points", -1).limit(limit))
        
        result = []
        for index, user in enumerate(leaderboard_users):
            user_data = {
                "user_id": str(user["_id"]),
                "username": user["username"],
                "total_points": user.get("total_points", 0),
                "rank": index + 1  # Add 1 because ranks start at 1, not 0
            }
            
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

        try:
            object_id = ObjectId(question_id)
        except Exception as e:
            print("ERROR: question_id is not a valid ObjectId:", e)
            return Response(
                json.dumps({"error": "Invalid question_id format"}),
                status=400,
                mimetype="application/json"
            )

        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers_col = db["answers"]
        questions_col = db["questions"]

        question_doc = questions_col.find_one({"_id": object_id})
        if not question_doc:
            print("DEBUG: No question found with that _id")
            client.close()
            return Response(
                json.dumps({"error": "Question not found"}),
                status=404,
                mimetype="application/json"
            )
        count = answers_col.count_documents({"question_id": object_id})

        raw_answers = list(answers_col.aggregate([
            {"$match": {"question_id": object_id}},
            {"$sample": {"size": 2}}
        ]))
        print("DEBUG: raw sampled answers (before cleaning) =", raw_answers)

        enriched_answers = []
        for ans in raw_answers:
            clean_ans = {
                "_id": str(ans["_id"]),
                "question_id": str(ans["question_id"]),
                "user_id": str(ans["user_id"]),
                "answer_text": ans.get("answer_text", ""),
                "votes": ans.get("votes", 0),
                "appearances": ans.get("appearances", 0),
                "question_text": question_doc["question"],
                "date": question_doc["date"].strftime("%m-%d-%Y")
            }
            enriched_answers.append(clean_ans)

        client.close()
        print("DEBUG: returning enriched answers:", enriched_answers)

        return Response(
            json.dumps(enriched_answers),
            mimetype="application/json"
        )

    except Exception as e:
        print("ERROR in get_pair:", e)
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json"
        )

@app.route('/answer/<answer_id>/increment-appearance', methods=['POST'])
def increment_appearance_count(answer_id):
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers = db["answers"]

        from bson.objectid import ObjectId
        object_id = ObjectId(answer_id)

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
        try:
            object_id = ObjectId(question_id)
        except Exception as e:
            return Response(
                json.dumps({"error": "Invalid question_id format"}),
                status=400,
                mimetype="application/json"
            )

        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers_col = db["answers"]
        users_col = db["users"]

        answer_cursor = answers_col.find({"question_id": object_id})

        enriched = []
        for ans in answer_cursor:
            votes = ans.get("votes", 0)
            appearances = ans.get("appearances", 1)
            appearances = max(appearances, 1)
            ratio = votes / appearances
            clean_ans = {
                "_id": str(ans["_id"]),
                "question_id": str(ans["question_id"]),
                "user_id": str(ans["user_id"]),
                "answer_text": ans.get("answer_text", ""),
                "votes": votes,
                "appearances": appearances
            }

            user_doc = users_col.find_one({"_id": ObjectId(ans["user_id"])})
            if user_doc:
                clean_user = {
                    "_id": str(user_doc["_id"]),
                    "username": user_doc.get("username", ""),
                    "name": user_doc.get("name", ""),
                    "avatar_url": user_doc.get("avatar_url", "")
                }
            else:
                clean_user = {
                    "_id": str(ans["user_id"]),
                    "username": "Unknown",
                    "name": "",
                    "avatar_url": ""
                }

            enriched.append({
                "answer": clean_ans,
                "user": clean_user,
                "ratio": ratio
            })

        client.close()

        enriched.sort(key=lambda x: x["ratio"], reverse=True)

        result = [{"answer": item["answer"], "user": item["user"]} for item in enriched]

        return Response(json.dumps(result), mimetype="application/json")

    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json"
        )

@app.route('/answer', methods=['POST'])
def create_answer():
    try:
        data = request.json or {}
        required_fields = ["user_id", "question_id", "answer_text"]
        for f in required_fields:
            if f not in data:
                return Response(
                    json.dumps({"error": f"Missing required field: {f}"}),
                    status=400,
                    mimetype="application/json"
                )

        user_oid = ObjectId(data["user_id"])
        question_oid = ObjectId(data["question_id"])

        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        answers_col = db["answers"]

        existing = answers_col.find_one({
            "user_id": user_oid,
            "question_id": question_oid
        })
        if existing:
            client.close()
            return Response(
                json.dumps({"error": "You have already submitted an answer"}),
                status=409,
                mimetype="application/json"
            )

        new_ans = {
            "user_id": user_oid,
            "question_id": question_oid,
            "answer_text": data["answer_text"],
            "votes": 0,
            "appearances": 0,
            "created_at": datetime.utcnow()
        }
        result = answers_col.insert_one(new_ans)
        client.close()

        return Response(
            json.dumps({
                "message": "Answer created",
                "answer_id": str(result.inserted_id)
            }),
            status=201,
            mimetype="application/json"
        )

    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json"
        )

@app.route('/user/username/<username>', methods=['GET'])
def get_user_by_username(username: str):
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]

        user = users.find_one({"username": username})
        client.close()

        if not user:
            return Response(
                json.dumps({"error": "User not found"}),
                status=404,
                mimetype="application/json"
            )

        return Response(
            json.dumps({
                "user_id": str(user["_id"]),
                "username": user["username"],
                "total_points": user.get("total_points", 0),
                "name": user.get("name", ""),
                "avatar_url": user.get("avatar_url", "")
            }),
            mimetype="application/json"
        )
    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json"
        )

@app.route('/groups/create-group', methods=['POST'])
def create_group():
    try:
        group_data = request.json
        
        required_fields = ['group_name', 'password', 'username']
        for field in required_fields:
            if field not in group_data:
                return Response(json.dumps({
                    "error": f"Missing required field: {field}"
                }), status=400, mimetype="application/json")
        

        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        groups = db["groups"]
        users = db["users"]
        
        existing_group = groups.find_one({"group_name": group_data['group_name']})
        
        if existing_group:
            client.close()
            return Response(json.dumps({
                "error": "Group name already in use"
            }), status=409, mimetype="application/json")
        
        hashed_password = generate_password_hash(group_data['password'])

        new_group = {
            "group_name": group_data['group_name'],
            "password": hashed_password,
            "group_size": 1,
            "members": [group_data['username']],
        }
        
        result = groups.insert_one(new_group)
        group_id = str(result.inserted_id)

        users.update_one(
            {"username": group_data['username']},
            {"$push": {"groups": group_data['group_name']}}
        )

        client.close()
        
        return Response(json.dumps({
            "message": "Group created successfully",
            "group_id": group_id
        }), status=201, mimetype="application/json")

    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

@app.route('/groups/get-groups/<username>', methods=['GET'])
def get_user_groups(username):
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        users = db["users"]
        groups = db["groups"]
        
        user = users.find_one({"username": username})
        
        if not user:
            client.close()
            return Response(json.dumps({
                "error": "User not found"
            }), status=404, mimetype="application/json")
        
        user_groups = user.get("groups", [])

        group_details = []
        for group_name in user_groups:
            group = groups.find_one({"group_name": group_name})
            if group:
                members = group.get("members", [])
                group_details.append({
                    "group_name": group_name,
                    "group_size": len(members)
                })
        
        client.close()
        
        return Response(json.dumps({
            "groups": group_details
        }), mimetype="application/json")
        
    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

@app.route('/groups/join-group', methods=['POST'])
def join_group():
    try:
        join_data = request.json

        required_fields = ['group_name', 'password', 'username']
        for field in required_fields:
            if field not in join_data:
                return Response(json.dumps({
                    "error": f"Missing required field: {field}"
                }), status=400, mimetype="application/json")
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        groups = db["groups"]
        users = db["users"]
        
        group = groups.find_one({"group_name": join_data['group_name']})
        
        if not group:
            client.close()
            return Response(json.dumps({
                "error": "Group not found"
            }), status=404, mimetype="application/json")
        
        if not check_password_hash(group['password'], join_data['password']):
            client.close()
            return Response(json.dumps({
                "error": "Incorrect password"
            }), status=401, mimetype="application/json")
        
        if join_data['username'] in group['members']:
            client.close()
            return Response(json.dumps({
                "error": "User is already a member of this group"
            }), status=409, mimetype="application/json")
        
        user = users.find_one({"username": join_data['username']})
        if not user:
            client.close()
            return Response(json.dumps({
                "error": "User not found"
            }), status=404, mimetype="application/json")
        
        groups.update_one(
            {"group_name": join_data['group_name']},
            {"$push": {"members": join_data['username']}}
        )
        
        users.update_one(
            {"username": join_data['username']},
            {"$push": {"groups": join_data['group_name']}}
        )
        
        client.close()
        
        return Response(json.dumps({
            "message": "Successfully joined group"
        }), mimetype="application/json")
        
    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

@app.route('/groups/leaderboard/<group_name>', methods=['GET'])
def get_group_leaderboard(group_name):
    try:
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        groups = db["groups"]
        users = db["users"]
        
        group = groups.find_one({"group_name": group_name})
        if not group:
            client.close()
            return Response(json.dumps({
                "error": "Group not found"
            }), status=404, mimetype="application/json")
        
        group_members = group.get("members", [])
        
        user_cursor = users.find({"username": {"$in": group_members}})
        
        enriched = []
        for user in user_cursor:
            clean_user = {
                "_id": str(user["_id"]),
                "username": user.get("username", ""),
                "name": user.get("name", ""),
                "avatar_url": user.get("avatar_url", ""),
                "total_points": user.get("total_points", 0)
            }
            enriched.append(clean_user)
        
        client.close()
        
        enriched.sort(key=lambda x: x["total_points"], reverse=True)
        
        for index, user in enumerate(enriched):
            user["rank"] = index + 1
        
        return Response(json.dumps({
            "leaderboard": enriched,
            "total_users": len(enriched),
            "group_name": group_name
        }), mimetype="application/json")
        
    except Exception as e:
        return Response(json.dumps({
            "error": str(e)
        }), status=500, mimetype="application/json")

@app.route('/groups/<group_name>/answer-leaderboard/<question_id>', methods=['GET'])
def get_group_answer_leaderboard(group_name, question_id):
    try:
        try:
            object_id = ObjectId(question_id)
        except Exception as e:
            return Response(
                json.dumps({"error": "Invalid question_id format"}),
                status=400,
                mimetype="application/json"
            )
        
        client = MongoClient(config["ATLAS_URI"], tlsCAFile=certifi.where())
        db = client[config["DB_NAME"]]
        groups = db["groups"]
        answers_col = db["answers"]
        users_col = db["users"]

        group = groups.find_one({"group_name": group_name})
        if not group:
            client.close()
            return Response(json.dumps({
                "error": "Group not found"
            }), status=404, mimetype="application/json")
        
        group_members = group.get("members", [])

        answer_cursor = answers_col.find({"question_id": object_id})

        enriched = []
        for ans in answer_cursor:
            user_doc = users_col.find_one({"_id": ObjectId(ans["user_id"])})
            
            if user_doc and user_doc.get("username") in group_members:
                votes = ans.get("votes", 0)
                appearances = ans.get("appearances", 1)
                appearances = max(appearances, 1)
                ratio = votes / appearances

                clean_ans = {
                    "_id": str(ans["_id"]),
                    "question_id": str(ans["question_id"]),
                    "user_id": str(ans["user_id"]),
                    "answer_text": ans.get("answer_text", ""),
                    "votes": votes,
                    "appearances": appearances
                }

                clean_user = {
                    "_id": str(user_doc["_id"]),
                    "username": user_doc.get("username", ""),
                    "name": user_doc.get("name", ""),
                    "avatar_url": user_doc.get("avatar_url", "")
                }

                enriched.append({
                    "answer": clean_ans,
                    "user": clean_user,
                    "ratio": ratio
                })

        client.close()

        enriched.sort(key=lambda x: x["ratio"], reverse=True)
        
        result = [{"answer": item["answer"], "user": item["user"]} for item in enriched]

        return Response(json.dumps(result), mimetype="application/json")

    except Exception as e:
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json"
        )
    
if __name__ == '__main__':
    app.debug = True
    app.run()