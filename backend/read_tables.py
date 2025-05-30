#!/usr/bin/env python3
# Python script used to read each table.

from dotenv import dotenv_values
from pymongo import MongoClient
import ssl
import certifi

config = dotenv_values("../.env")
ca = certifi.where()
client = MongoClient(config["ATLAS_URI"],  tlsCAFile=certifi.where())# , ssl_cert_reqs=ssl.CERT_NONE) # , tlsCAFile=certifi.where()
db = client[config["DB_NAME"]]

users = db["users"]
questions = db["questions"]
answers = db["answers"]

print("Entries in Users Table:")
print("------------------------------")
print(list(users.find()))
print()

print("Entries in Questions Table:")
print("------------------------------")
for row in questions.find():
    print(row)
print()

print("Entries in Answers Table:")
print("------------------------------")
for row in answers.find():
    print(row)
client.close()
