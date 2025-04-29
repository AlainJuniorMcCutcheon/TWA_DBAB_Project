from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.lang import Builder
from db_layer import register_guest, login_guest

Builder.load_file('ui.kv')

class WelcomeScreen(Screen):
    pass

class LoginScreen(Screen):
    pass

class RegisterScreen(Screen):
    pass

class SearchScreen(Screen):
    pass

class BnbApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(WelcomeScreen(name='welcome'))
        sm.add_widget(LoginScreen(name='login'))
        sm.add_widget(RegisterScreen(name='register')) 
        sm.add_widget(SearchScreen(name='search'))
        return sm
    
    def register_guest(self):
        # Get data from RegisterPopup
        popup = self.root.get_screen('welcome').ids.register_popup
        email = popup.ids.email.text
        password = popup.ids.password.text
        first_name = popup.ids.first_name.text
        last_name = popup.ids.last_name.text
        
        # Call backend
        result = register_guest(email, password, first_name, last_name)
        if result.get('success'):
            print("Guest registered!")  # Replace with navigation to search screen
        else:
            print("Error:", result.get('message'))
    
    def login_guest(self):
        # Get data from LoginScreen
        screen = self.root.get_screen('login')
        email = screen.ids.email.text
        password = screen.ids.password.text
        
        # Call backend
        result = login_guest(email, password)
        if result.get('success'):
            self.root.current = 'search'  # Navigate to search screen
        else:
            print("Login failed")

if __name__ == '__main__':
    BnbApp().run()