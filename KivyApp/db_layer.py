import os
from dotenv import load_dotenv
import bcrypt
import logging

from bson.decimal128 import Decimal128
from pymongo import MongoClient
import certifi

from datetime import datetime
from bson import ObjectId

logging.getLogger("pymongo").setLevel(logging.WARNING)

# Load environment variables from .env file
load_dotenv()

class DatabaseLayer:
    def __init__(self):
        try:
            mongo_uri = os.getenv("MONGO_URI")
            if not mongo_uri:
                raise ValueError("MONGO_URI environment variable not set")
            
            self.client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
            self.db = self.client["AirBnB"]  # Use your database name here
            
            # Confirm connection
            self.db.command('ping')
            print("Successfully connected to MongoDB!")
        except Exception as e:
            print(f"Database connection error: {e}")
            raise

    def register_guest(self, email, password, first_name, last_name):
        try:
            if not all([email, password, first_name, last_name]):
                return {'success': False, 'message': 'All fields are required'}

            if '@' not in email or '.' not in email:
                return {'success': False, 'message': 'Invalid email format'}

            if self.db.Users.find_one({'email': email}):
                return {'success': False, 'message': 'Email already registered'}

            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            user = {
                'email': email,
                'password': hashed_password.decode('utf-8'),
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
        try:
            user = self.db.Users.find_one({'email': email, 'role': 'guest'})
            if not user:
                return {'success': False, 'message': 'No account found with this email'}

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
        return {'success': True, 'message': 'Logged out successfully'}

    def get_filtered_listings(self, city=None, max_price=None):
        try:
            query = {}

            # Validate and add city to query
            if city:
                city = city.strip().lower()
                query["address.market"] = {"$regex": f"^{city}$", "$options": "i"}

            # Validate and add max_price to query
            if max_price:
                try:
                    max_price = float(max_price)
                    query["price"] = {"$lte": Decimal128(str(max_price))}
                except ValueError:
                    return {"success": False, "message": "Max price must be a number."}

            listings = list(self.db.Listings.find(query, {"_id": 0}).limit(50))
            return {"success": True, "listings": listings}
        except Exception as e:
            return {"success": False, "message": f"Error fetching listings: {str(e)}"}
        
    def create_reservation(self, guest_id, listing):
        try:
            if not listing or not guest_id:
                return {'success': False, 'message': 'Invalid reservation data'}

            host_id = listing.get('host', [{}]).get('host_id')
            if not host_id:
                return {'success': False, 'message': 'Host ID not found for listing'}

            reservation = {
                'listing_id': listing.get('id', str(ObjectId())),
                'guest_id': guest_id,
                'host_id': host_id,
                'status': 'Pending',
                'timestamp': datetime.utcnow()
            }

            self.db.Reservations.insert_one(reservation)
            return {'success': True, 'message': 'Reservation created successfully'}
        except Exception as e:
            return {'success': False, 'message': str(e)}


# Instantiate the database layer
db_layer = DatabaseLayer()
