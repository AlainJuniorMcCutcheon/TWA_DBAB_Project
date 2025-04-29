# db_layer.py
import requests

BASE_URL = "http://localhost:5000/api"  # Replace with teammate's server URL

def register_guest(email, password, first_name, last_name):
    response = requests.post(
        f"{BASE_URL}/guest/register",
        json={
            "email": email,
            "password": password,
            "firstName": first_name,
            "lastName": last_name
        }
    )
    return response.json()

def login_guest(email, password):
    response = requests.post(
        f"{BASE_URL}/guest/login",
        json={"email": email, "password": password}
    )
    return response.json()