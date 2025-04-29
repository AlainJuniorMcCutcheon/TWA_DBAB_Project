from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import certifi

# MongoDB connection
client = MongoClient(
    "mongodb+srv://<username>:<password>@freeworld.5dellif.mongodb.net/?retryWrites=true&w=majority&appName=FreeWorld",
    tlsCAFile=certifi.where()
)
db = client.bnb_app

def register_guest(email, password, first_name, last_name):
    """Register a new guest user"""
    # Validate inputs
    if not all([email, password, first_name, last_name]):
        return {'success': False, 'message': 'All fields are required'}
    
    # Check if email already exists
    if db.guests.find_one({'email': email}):
        return {'success': False, 'message': 'Email already registered'}
    
    # Create new guest
    guest = {
        'email': email,
        'password': generate_password_hash(password),
        'first_name': first_name,
        'last_name': last_name,
        'reservations': []
    }
    
    try:
        db.guests.insert_one(guest)
        return {'success': True, 'message': 'Registration successful'}
    except Exception as e:
        return {'success': False, 'message': str(e)}

def login_guest(email, password):
    """Authenticate a guest user"""
    guest = db.guests.find_one({'email': email})
    
    if not guest:
        return {'success': False, 'message': 'Invalid email or password'}
    
    if not check_password_hash(guest['password'], password):
        return {'success': False, 'message': 'Invalid email or password'}
    
    return {'success': True, 'message': 'Login successful', 'guest_id': str(guest['_id'])}

def logout_guest():
    """Logout the current guest"""
    return {'success': True, 'message': 'Logged out successfully'}