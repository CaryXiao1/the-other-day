# backend

This is the backend code for our CS278 final project. 

## Usage

Our backend uses Python and Flask. Therefore, make sure you have Python3.12 installed:
```
python3 --version
```
Install all neccessary libraries:
```
pip3 install -r requirements.txt
```
Finally, you can run our backend by running 
```
python3 server.py
```
You can manually view the endpoints for this backend by going to the base URL listed when running `server.py` and appending the endpoint tag, listed above each endpoint function.

## Extra Scripts

### `read_tables.py`

This function lists all information in the database. It is useful to verify that the mongoDB accessing is working correctly on your system.

The main backend server code is in `server.py`.