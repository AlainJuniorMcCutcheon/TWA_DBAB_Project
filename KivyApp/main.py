from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.lang import Builder
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.image import AsyncImage
from db_layer import db_layer
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
        self.ids.listing_name.text = f"Listing Name: {listing.get('name', 'N/A')}"
        self.ids.listing_price.text = f"Price: ${listing.get('price', 0)}/night"

        # Correct way to extract picture_url
        picture_url = listing.get('images', [{}]).get('picture_url')
        if picture_url:
            self.ids.listing_image.source = picture_url
        else:
            self.ids.listing_image.source = 'default.jpg'  # fallback image

        self.listing = listing

class MyScreenManager(ScreenManager):
    pass

class BnbApp(App):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.current_user = None  # Keeps track of the logged-in user

    def build(self):
        self.sm = ScreenManager()
        self.sm.add_widget(WelcomeScreen(name='welcome'))
        self.sm.add_widget(LoginScreen(name='login'))
        self.sm.add_widget(RegisterScreen(name='register'))
        self.sm.add_widget(SearchScreen(name='search'))
        self.sm.add_widget(ReservationScreen(name='reservation'))
        return self.sm

    def logout_guest(self):
        # Clear the current user session
        self.current_user = None
        
        # Navigate back to the LoginScreen
        self.root.current = 'login'

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
            self.current_user = {
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
        max_price = int(max_price_text) if max_price_text.isdigit() else float('inf')

        result = db_layer.get_filtered_listings()
        if result.get('success'):
            listings = result['listings']
            filtered = []

            for l in listings:
                price = self.convert_decimal128_to_float(l.get('price', 0))

                if city and city not in l.get('address', {}).get('market', '').lower():
                    continue
                if price is not None and price > max_price:
                    continue

                filtered.append(l)

            if not filtered:
                listings_box.add_widget(Label(text="No listings match your search."))
                return

            for listing in filtered:
                row = BoxLayout(orientation='horizontal', size_hint_y=None, height=120, spacing=10)

                # Extract the picture URL
                picture_url = listing.get('images', [{}]).get('picture_url')

                image = AsyncImage(
                    source=picture_url if picture_url else 'default.jpg',
                    size_hint_x=None,
                    width=100
                )

                listing_text = f"[b]{listing.get('name', 'Untitled')}[/b]\nLocation: {listing.get('address', {}).get('market', 'N/A')}\nPrice: ${self.convert_decimal128_to_float(listing.get('price', 0))}/night"
                label = Label(text=listing_text, markup=True, halign="left", valign="middle")
                label.bind(size=label.setter('text_size'))

                check_button = Button(
                    text="Check Availability",
                    size_hint_x=None,
                    width=160
                )
                
                # Bind button click to the check_availability method and pass the listing

                
                check_button.bind(on_press=lambda instance, l=listing: self.check_availability(l))

                row.add_widget(image)
                row.add_widget(label)
                row.add_widget(check_button)
                listings_box.add_widget(row)

        else:
            listings_box.add_widget(Label(text="Error loading listings."))

    def check_availability(self, listing):
        reservation_screen = self.root.get_screen('reservation')
        reservation_screen.display_listing_details(listing)
        self.root.current = 'reservation'

    def convert_decimal128_to_float(self, value):
        if isinstance(value, Decimal128):
            return float(value.to_decimal())
        elif isinstance(value, Decimal):
            return float(value)
        return float(value)
    
    def check_availability(self, listing):
        reservation_screen = self.root.get_screen('reservation')
        reservation_screen.display_listing_details(listing)
        reservation_screen.listing = listing
        self.root.current = 'reservation'

    def reserve_listing(self):
        if not self.current_user:
            return

        reservation_screen = self.root.get_screen('reservation')
        listing = reservation_screen.listing
        guest_id = self.current_user['user_id']

        result = db_layer.create_reservation(guest_id, listing)
        reservation_screen.ids.reservation_result.text = result.get('message')


if __name__ == '__main__':
    BnbApp().run()
