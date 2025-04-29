try:
    from pymongo import MongoClient
    from werkzeug.security import generate_password_hash, check_password_hash
    import certifi
except ImportError as e:
    print(f"Import error: {e}. Please install the required packages.")
    raise

class DatabaseLayer:
    def __init__(self):
        try:
            # Replace with your actual MongoDB credentials
            self.client = MongoClient(
                "mongodb+srv://<username>:<password>@freeworld.5dellif.mongodb.net/?retryWrites=true&w=majority&appName=FreeWorld",
                tlsCAFile=certifi.where()
            )
            self.db = self.client.bnb_app
        except Exception as e:
            print(f"Database connection error: {e}")
            raise

    def register_guest(self, email, password, first_name, last_name):
        """Register a new guest user"""
        try:
            # Validate inputs
            if not all([email, password, first_name, last_name]):
                return {'success': False, 'message': 'All fields are required'}
            
            # Check if email already exists
            if self.db.guests.find_one({'email': email}):
                return {'success': False, 'message': 'Email already registered'}
            
            # Create new guest
            guest = {
                'email': email,
                'password': generate_password_hash(password),
                'first_name': first_name,
                'last_name': last_name,
                'reservations': []
            }
            
            self.db.guests.insert_one(guest)
            return {'success': True, 'message': 'Registration successful'}
        
        except Exception as e:
            return {'success': False, 'message': f'Registration error: {str(e)}'}

    def login_guest(self, email, password):
        """Authenticate a guest user"""
        try:
            guest = self.db.guests.find_one({'email': email})
            
            if not guest:
                return {'success': False, 'message': 'Invalid email or password'}
            
            if not check_password_hash(guest['password'], password):
                return {'success': False, 'message': 'Invalid email or password'}
            
            return {
                'success': True, 
                'message': 'Login successful', 
                'guest_id': str(guest['_id']),
                'first_name': guest['first_name']
            }
        
        except Exception as e:
            return {'success': False, 'message': f'Login error: {str(e)}'}

    def logout_guest(self):
        """Logout the current guest"""
        return {'success': True, 'message': 'Logged out successfully'}

# Create a single instance to use throughout your app
db_layer = DatabaseLayer()