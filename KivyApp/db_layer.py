import os
from dotenv import load_dotenv
import bcrypt
import logging

from bson.decimal128 import Decimal128
from pymongo import MongoClient
import certifi

from bson.objectid import ObjectId

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

            # Apply city filter if provided
            if city:
                city = city.strip()
                query["address.market"] = {"$regex": f"^{city}$", "$options": "i"}

            # Apply price filter if provided
            if max_price:
                try:
                    max_price = float(max_price)
                    query["price"] = {"$lte": Decimal128(str(max_price))}
                except ValueError:
                    return {"success": False, "message": "Max price must be a number."}

            # Base MongoDB query - removed {"_id": 0} to include the id
            cursor = self.db.Listings.find(query)

            # Apply limit only if at least one filter is used
            if query:
                cursor = cursor.limit(50)

            listings = list(cursor)
            return {"success": True, "listings": listings}
        except Exception as e:
            return {"success": False, "message": f"Error fetching listings: {str(e)}"}
        

        # Add this method to the DatabaseLayer class in db_layer.py
    def create_reservation(self, guest_id, listing_id, check_in, check_out, guests, guest_name):
        try:
            # Get user and listing details
            user = self.db.Users.find_one({'_id': ObjectId(guest_id)})
            listing = self.db.Listings.find_one({'_id': listing_id})
            
            if not user or not listing:
                return {'success': False, 'message': 'Invalid user or listing'}
            
            # Convert string dates to date objects for comparison
            from datetime import datetime
            try:
                check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            except ValueError:
                return {'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD'}
            
            # Validation checks
            if check_out_date <= check_in_date:
                return {'success': False, 'message': 'Check-out date must be after check-in date'}
            
            if int(guests) > listing.get('accommodates', 1):
                return {'success': False, 'message': f'Number of guests exceeds maximum ({listing.get("accommodates", 1)})'}
            
            # Calculate total price
            nights = (check_out_date - check_in_date).days
            price_per_night = self.convert_decimal128_to_float(listing.get('price', 0))
            total_price = nights * price_per_night
            
            # Create reservation document
            reservation = {
                'hostId': listing.get('host', {}).get('host_id', ''),
                'host': listing.get('host', {}).get('host_name', 'Host'),
                'guest': f"{user['first_name']} {user['last_name']}",
                'guest_id': guest_id,
                'listing_id': listing_id,
                'listing_title': listing.get('name', ''),
                'city': listing.get('address', {}).get('market', 'N/A'),
                'check_in': check_in,
                'check_out': check_out,
                'guests': int(guests),
                'total_price': total_price,
                'status': 'PENDING'  # Initial status
            }
            
            # Insert reservation
            result = self.db.Reservations.insert_one(reservation)
            
            # Add reservation reference to user
            self.db.Users.update_one(
                {'_id': ObjectId(guest_id)},
                {'$push': {'reservations': result.inserted_id}}
            )
            
            return {'success': True, 'message': 'Reservation request submitted successfully'}
        
        except Exception as e:
            return {'success': False, 'message': f'Reservation error: {str(e)}'}

    # Also add this helper method to the class
    def convert_decimal128_to_float(self, value):
        if isinstance(value, Decimal128):
            return float(value.to_decimal())
        return float(value)
    
    def get_guest_reservations(self, guest_id):
        try:
            reservations = list(self.db.Reservations.find({'guest_id': guest_id}).sort('check_in', -1))
            return {'success': True, 'reservations': reservations}
        except Exception as e:
            return {'success': False, 'message': f'Error fetching reservations: {str(e)}'}

    def cancel_reservation(self, reservation_id):
        try:
            result = self.db.Reservations.update_one(
                {'_id': ObjectId(reservation_id)},
                {'$set': {'status': 'CANCELLED'}}
            )
            return {'success': True, 'message': 'Reservation cancelled successfully'}
        except Exception as e:
            return {'success': False, 'message': f'Error cancelling reservation: {str(e)}'}




# Instantiate the database layer
db_layer = DatabaseLayer()