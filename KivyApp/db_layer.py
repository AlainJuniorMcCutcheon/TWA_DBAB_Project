import os
from dotenv import load_dotenv
import bcrypt

import logging

logging.getLogger("pymongo").setLevel(logging.WARNING)

try:
    from pymongo import MongoClient
    import certifi
except ImportError as e:
    print(f"Import error: {e}. Please install the required packages.")
    raise

# Load environment variables from .env file
load_dotenv()

class DatabaseLayer:
    def __init__(self):
        try:
            # Get MongoDB URI from environment variables
            mongo_uri = os.getenv("MONGO_URI")
            
            if not mongo_uri:
                raise ValueError("MONGO_URI environment variable not set")
            
            self.client = MongoClient(
                mongo_uri,
                tlsCAFile=certifi.where()
            )
            self.db = self.client["AirBnB"]  # Using "AirBnB" database
            
            # Test the connection
            self.db.command('ping')
            print("Successfully connected to MongoDB!")
            
        except Exception as e:
            print(f"Database connection error: {e}")
            raise

    def register_guest(self, email, password, first_name, last_name):
        """Register a new guest user"""
        try:
            # Validate inputs
            if not all([email, password, first_name, last_name]):
                return {'success': False, 'message': 'All fields are required'}
            
            # Password length validation
            #if len(password) < 8:
            #    return {'success': False, 'message': 'Password must be at least 8 characters'}
            
            # Basic email validation
            if '@' not in email or '.' not in email:
                return {'success': False, 'message': 'Invalid email format'}
            
            # Check if email already exists in Users collection
            if self.db.Users.find_one({'email': email}):
                return {'success': False, 'message': 'Email already registered'}
            
            # Hash password with bcrypt
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            # Create new user with guest role
            user = {
                'email': email,
                'password': hashed_password.decode('utf-8'),  # Store as string
                'first_name': first_name,
                'last_name': last_name,
                'role': 'guest',
                'reservations': []
            }
            
            self.db.Users.insert_one(user)
            return {'success': True, 'message': 'Registration successful'}
        
        except Exception as e:
            return {'success': False, 'message': f'Registration error: {str(e)}'}

    def login_guest(self, email, password):
        """Authenticate a guest user"""
        try:
            # Find user in Users collection
            user = self.db.Users.find_one({
                'email': email,
                'role': 'guest'
            })
            
            if not user:
                return {'success': False, 'message': 'No account found with this email'}
            
            # Verify password with bcrypt
            if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                return {'success': False, 'message': 'Incorrect password'}
            
            return {
                'success': True, 
                'message': 'Login successful', 
                'user_id': str(user['_id']),
                'first_name': user['first_name'],
                'role': user['role']
            }
        
        except Exception as e:
            return {'success': False, 'message': f'Login error: {str(e)}'}

    def logout_guest(self):
        """Logout the current guest"""
        return {'success': True, 'message': 'Logged out successfully'}

# Create a single instance to use throughout your app
db_layer = DatabaseLayer()