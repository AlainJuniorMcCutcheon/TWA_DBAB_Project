# Registration Functions
def register_guest(guest_data: dict) -> tuple:
    """
    Register a new guest user
    Args:
        guest_data: {
            "email": str,
            "password": str,
            "first_name": str,
            "last_name": str,
            "phone": str
        }
    Returns:
        (success: bool, message: str)
    """
    pass

def register_host(host_data: dict) -> tuple:
    """
    Register a new host user
    Args:
        host_data: {
            "email": str,
            "password": str,
            "first_name": str,
            "last_name": str,
            "host_id": str
        }
    Returns:
        (success: bool, message: str)
    """
    pass

# Authentication Functions
def authenticate_guest(email: str, password: str) -> tuple:
    """
    Authenticate guest user
    Returns:
        (success: bool, user_data: dict/None)
    """
    pass

def authenticate_host(email: str, password: str) -> tuple:
    """
    Authenticate host user
    Returns:
        (success: bool, user_data: dict/None)
    """
    pass

# Search Functions
def search_listings(
    location: str = None,
    price_min: float = None,
    price_max: float = None,
    bedrooms: int = None,
    amenities: list = None,
    date_range: tuple = None
) -> list:
    """
    Search available listings with filters
    Returns list of matching listings
    """
    pass

def get_listing_details(listing_id: str) -> dict:
    """
    Get full details for a specific listing
    """
    pass

def check_listing_availability(listing_id: str, start_date: str, end_date: str) -> bool:
    """
    Check if listing is available for given dates
    Returns True if available
    """
    pass

# Reservation Functions
def create_reservation(reservation_data: dict) -> tuple:
    """
    Create a new reservation
    Args:
        reservation_data: {
            "guest_id": str,
            "listing_id": str,
            "start_date": str,
            "end_date": str,
            "guests": int,
            "total_price": float
        }
    Returns:
        (success: bool, reservation_id: str/None)
    """
    pass

def get_guest_reservations(guest_id: str, status_filter: str = None) -> list:
    """
    Get all reservations for a guest
    Optional status filter: "pending", "confirmed", "completed", "cancelled"
    """
    pass

def get_host_reservations(host_id: str, status_filter: str = None) -> list:
    """
    Get all reservations for a host's properties
    Optional status filter
    """
    pass

def update_reservation_status(reservation_id: str, new_status: str) -> bool:
    """
    Update reservation status
    Valid statuses: "pending", "confirmed", "completed", "cancelled"
    Returns success status
    """
    pass

def cancel_reservation(reservation_id: str, guest_id: str) -> bool:
    """
    Cancel a reservation (guest-initiated)
    Returns success status
    """
    pass