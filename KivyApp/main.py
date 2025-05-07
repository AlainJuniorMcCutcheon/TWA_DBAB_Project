from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.lang import Builder
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from db_layer import db_layer  # Make sure your db_layer is imported correctly
from bson import Decimal128
from decimal import Decimal

Builder.load_file('ui.kv')

class WelcomeScreen(Screen):
    pass

class LoginScreen(Screen):
    pass

class RegisterScreen(Screen):
    pass

class SearchScreen(Screen):
    pass

class ReservationScreen(Screen):
    def display_listing_details(self, listing):
        # Display listing details on the ReservationScreen
        self.ids.listing_name.text = f"Listing Name: {listing.get('name', 'N/A')}"
        self.ids.listing_price.text = f"Price: ${listing.get('price', 0)}/night"
        self.ids.listing_location.text = f"Location: {listing.get('address', {}).get('market', 'N/A')}"
        
        # Store the listing for future use if needed (e.g., for confirming reservation)
        self.listing = listing

class MyScreenManager(ScreenManager):
    pass

class BnbApp(App):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_user = None  # Track logged in user

    def build(self):
        self.sm = ScreenManager()
        self.sm.add_widget(WelcomeScreen(name='welcome'))
        self.sm.add_widget(LoginScreen(name='login'))
        self.sm.add_widget(RegisterScreen(name='register'))
        self.sm.add_widget(SearchScreen(name='search'))
        self.sm.add_widget(ReservationScreen(name='reservation'))  # Add ReservationScreen
        return self.sm

    def register_guest(self):
        screen = self.root.get_screen('register')
        email = screen.ids.email.text
        password = screen.ids.password.text
        first_name = screen.ids.first_name.text
        last_name = screen.ids.last_name.text

        result = db_layer.register_guest(email, password, first_name, last_name)
        if result.get('success'):
            screen.ids.error_label.text = ""
            screen.manager.current = 'search'
        else:
            screen.ids.error_label.text = result.get('message')

    def login_guest(self):
        screen = self.root.get_screen('login')
        email = screen.ids.email.text
        password = screen.ids.password.text

        result = db_layer.login_guest(email, password)
        if result.get('success'):
            self.current_user = {  # Store user data
                'user_id': result['user_id'],
                'email': email,
                'first_name': result['first_name'],
                'role': result['role']
            }
            screen.ids.error_label.text = ""
            self.root.current = 'search'
        else:
            screen.ids.error_label.text = result.get('message')

    
    def show_listings(self):
            screen = self.root.get_screen('search')
            listings_box = screen.ids.listings_box
            listings_box.clear_widgets()

            city = screen.ids.city.text.strip().lower()
            max_price_text = screen.ids.max_price.text.strip()

            # Handle max price (set to infinity if not entered correctly)
            max_price = int(max_price_text) if max_price_text.isdigit() else float('inf')

            result = db_layer.get_filtered_listings()  # Get all listings (without filters yet)
            if result.get('success'):
                listings = result['listings']
                filtered = []

                for l in listings:
                    print(f"Checking listing {l.get('name')} with price {l.get('price')}")

                    # Handle Decimal128 price conversion to float
                    price = self.convert_decimal128_to_float(l.get('price', 0))

                    # Filter by city (market field in address)
                    if city and city not in l.get('address', {}).get('market', '').lower():
                        continue  # Skip listing if city doesn't match

                    # Filter by max price
                    if price is not None and price > max_price:
                        continue  # Skip listing if price is greater than max_price

                    filtered.append(l)

                if not filtered:
                    listings_box.add_widget(Label(text="No listings match your search."))
                    return

                for listing in filtered:
                    # Create the row layout (Horizontal BoxLayout)
                    row = BoxLayout(orientation='horizontal', size_hint_y=None, height=100, spacing=10)

                    # Create the label for the listing
                    listing_text = f"[b]{listing.get('name', 'Untitled')}[/b]\nLocation: {listing.get('address', {}).get('market', 'N/A')}\nPrice: ${self.convert_decimal128_to_float(listing.get('price', 0))}/night"
                    label = Label(
                        text=listing_text,
                        markup=True,
                        halign="left",
                        valign="middle"
                    )
                    label.bind(size=label.setter('text_size'))  # Ensure text wraps properly

                    # Create the "Check Availability" button
                    check_button = Button(
                        text="Check Availability",
                        size_hint_x=None,
                        width=160  # Control the width of the button
                    )
                    check_button.on_press = lambda l=listing: self.check_availability(l)

                    # Add the label and button to the row layout
                    row.add_widget(label)
                    row.add_widget(check_button)

                    # Add the row layout to the listings box
                    listings_box.add_widget(row)

            else:
                listings_box.add_widget(Label(text="Error loading listings."))

    def check_availability(self, listing):
        # Navigate to ReservationScreen with the listing details
        reservation_screen = self.root.get_screen('reservation')
        reservation_screen.display_listing_details(listing)
        self.root.current = 'reservation'

    def convert_decimal128_to_float(self, value):
        """Convert Decimal128 to float, handling the case where it's not a Decimal128."""
        if isinstance(value, Decimal128):
            return float(value.to_decimal())  
        elif isinstance(value, Decimal):
            return float(value) 
        return float(value)  

if __name__ == '__main__':
    BnbApp().run()
