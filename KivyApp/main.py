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

class ViewReservationScreen(Screen):
    def on_pre_enter(self):
        self.load_reservations()
        
    def load_reservations(self):
        if not App.get_running_app().current_user:
            return
            
        self.ids.reservations_container.clear_widgets()
        guest_id = App.get_running_app().current_user['user_id']
        result = db_layer.get_guest_reservations(guest_id)
        
        if result.get('success'):
            for reservation in result['reservations']:
                self.add_reservation_card(reservation)
    
    def add_reservation_card(self, reservation):
        card = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            height=150,
            padding=10,
            spacing=5
        )
        
        # Title and status
        title_layout = BoxLayout(orientation='horizontal', size_hint_y=None, height=30)
        title_layout.add_widget(Label(
            text=f"[b]{reservation.get('listing_title', 'N/A')}[/b]",
            markup=True,
            halign='left',
            size_hint_x=0.7
        ))
        
        status_color = (0.8, 0.8, 0.8, 1)  # Default gray
        status_text = reservation.get('status', 'PENDING').upper()
        if status_text == 'PENDING':
            status_color = (1, 0.5, 0, 1)  # Orange
        elif status_text == 'CONFIRMED':
            status_color = (0, 0.8, 0, 1)  # Green
        elif status_text == 'CANCELLED':
            status_color = (1, 0, 0, 1)  # Red
            
        status_label = Label(
            text=f"Status: {status_text}",
            color=status_color,
            halign='right',
            size_hint_x=0.3
        )
        title_layout.add_widget(status_label)
        card.add_widget(title_layout)
        
        # Location
        card.add_widget(Label(
            text=f"City: {reservation.get('city', 'N/A')}",
            halign='left'
        ))
        
        # Price
        card.add_widget(Label(
            text=f"Total: ${reservation.get('total_price', 0):.2f}",
            halign='left'
        ))
        
        # Dates
        card.add_widget(Label(
            text=f"Check-in: {reservation.get('check_in', 'N/A')} - Check-out: {reservation.get('check_out', 'N/A')}",
            halign='left'
        ))
        
        # Cancel button (only for pending/confirmed)
        if reservation.get('status') in ['PENDING', 'CONFIRMED']:
            btn = Button(
                text='Cancel',
                size_hint_y=None,
                height=30,
                background_color=(1, 0, 0, 1)
            )
            btn.bind(on_press=lambda x, r=reservation: self.cancel_reservation(r))
            card.add_widget(btn)
        
        self.ids.reservations_container.add_widget(card)
    
    def cancel_reservation(self, reservation):
        result = db_layer.cancel_reservation(str(reservation['_id']))
        if result.get('success'):
            self.load_reservations() 

class ReservationScreen(Screen):
    def display_listing_details(self, listing, app):
        self.ids.listing_name.text = f"Listing Name: {listing.get('name', 'N/A')}"
        self.ids.listing_price.text = f"Price: ${app.convert_decimal128_to_float(listing.get('price', 0))}/night"
        
        # Clear previous inputs and results
        self.ids.check_in.text = ""
        self.ids.check_out.text = ""
        self.ids.guests.text = ""
        self.ids.reservation_result.text = ""
        
        # Set default guests to 1
        self.ids.guests.text = "1"
        
        # Set image with error handling
        picture_url = listing.get('images', {}).get('picture_url')
        try:
            if picture_url:
                self.ids.listing_image.source = picture_url
                self.ids.listing_image.reload()
            else:
                self.ids.listing_image.source = ''
        except:
            self.ids.listing_image.source = ''
        
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
        self.sm.add_widget(ViewReservationScreen(name='viewreservation'))
        return self.sm

    def logout_guest(self):
        # Clear the current user session
        self.current_user = None
        
        # Navigate back to the LoginScreen
        self.root.current = 'login'

    def view_reserve(self):
        if not self.current_user:
            return
            
        screen = self.root.get_screen('viewreservation')
        screen.load_reservations()
        self.root.current = 'viewreservation'

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

            filtered = filtered[:50]

            if not filtered:
                listings_box.add_widget(Label(text="No listings match your search."))
                return

            for listing in filtered:
                row = BoxLayout(orientation='horizontal', size_hint_y=None, height=120, spacing=10)

                picture_url = listing.get('images', {}).get('picture_url')

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
                check_button.bind(on_press=lambda instance, l=listing: self.check_availability(l))

                row.add_widget(image)
                row.add_widget(label)
                row.add_widget(check_button)
                listings_box.add_widget(row)

        else:
            listings_box.add_widget(Label(text="Error loading listings."))



    # def check_availability(self, listing):
    #     reservation_screen = self.root.get_screen('reservation')
    #     reservation_screen.display_listing_details(listing)
    #     self.root.current = 'reservation'

    def convert_decimal128_to_float(self, value):
        if isinstance(value, Decimal128):
            return float(value.to_decimal())
        elif isinstance(value, Decimal):
            return float(value)
        return float(value)

    # Update the check_availability method to use app's method
    def check_availability(self, listing):
        reservation_screen = self.root.get_screen('reservation')
        reservation_screen.display_listing_details(listing, self)
        reservation_screen.listing = listing
        self.root.current = 'reservation'

    def reserve_listing(self):
        if not self.current_user:
            return {'success': False, 'message': 'Not logged in'}

        reservation_screen = self.root.get_screen('reservation')
        listing = reservation_screen.listing
        guest_id = self.current_user['user_id']
        
        # Check if listing has an _id
        if '_id' not in listing:
            reservation_screen.ids.reservation_result.text = "Error: Listing information incomplete"
            reservation_screen.ids.reservation_result.color = (1, 0, 0, 1)
            return
        
        # Get input values
        check_in = reservation_screen.ids.check_in.text.strip()
        check_out = reservation_screen.ids.check_out.text.strip()
        guests = reservation_screen.ids.guests.text.strip()
        
        # Basic validation
        if not all([check_in, check_out, guests]):
            reservation_screen.ids.reservation_result.text = "All fields are required"
            reservation_screen.ids.reservation_result.color = (1, 0, 0, 1)
            return
        
        if not guests.isdigit():
            reservation_screen.ids.reservation_result.text = "Number of guests must be a whole number"
            reservation_screen.ids.reservation_result.color = (1, 0, 0, 1)
            return
        
        # Create reservation
        result = db_layer.create_reservation(
            guest_id=guest_id,
            listing_id=listing['_id'],
            check_in=check_in,
            check_out=check_out,
            guests=guests,
            guest_name=f"{self.current_user['first_name']} {self.current_user.get('last_name', '')}"
        )
        
        # Show result
        if result.get('success'):
            reservation_screen.ids.reservation_result.text = result['message']
            reservation_screen.ids.reservation_result.color = (0, 1, 0, 1)
            self.root.current == 'search'
        else:
            reservation_screen.ids.reservation_result.text = result['message']
            reservation_screen.ids.reservation_result.color = (1, 0, 0, 1)

    def cancel_reservation(self):
        print("cancelled")

    def show_reservations(self):
            screen = self.root.get_screen('viewreservations')
            listings_box = screen.ids.listings_box
            listings_box.clear_widgets()
            guest_id = self.current_user['user_id']

            # city = screen.ids.city.text.strip().lower()
            # max_price_text = screen.ids.max_price.text.strip()
            # max_price = int(max_price_text) if max_price_text.isdigit() else float('inf')

            result = db_layer.get_reservations(guest_id)
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
                # host_text = f"{listing.get('host_id', 'Untitled')}"
                    label = Label(text=listing_text, markup=True, halign="left", valign="middle")
                    label.bind(size=label.setter('text_size'))
                #  host = Label(text=host_text, markup=True, halign="left", valign="middle")
                # host.bind(size=host.setter('text_size'))

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
                    #row.add_widget(host)
                    listings_box.add_widget(row)

            else:
                listings_box.add_widget(Label(text="Error loading listings."))

if __name__ == '__main__':
    BnbApp().run()
