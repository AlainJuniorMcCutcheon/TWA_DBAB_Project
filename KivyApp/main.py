from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.lang import Builder
from db_layer import db_layer  # Import the db_layer instance

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
        self.sm = ScreenManager()
        self.sm.add_widget(WelcomeScreen(name='welcome'))
        self.sm.add_widget(LoginScreen(name='login'))
        self.sm.add_widget(RegisterScreen(name='register')) 
        self.sm.add_widget(SearchScreen(name='search'))
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
            screen.ids.error_label.text = ""
            self.root.current = 'search'
        else:
            screen.ids.error_label.text = result.get('message')
    
    def logout_guest(self):
        result = db_layer.logout_guest()
        if result.get('success'):
            # Clear any sensitive data
            self.root.current = 'welcome'
            # Clear login fields
            login_screen = self.root.get_screen('login')
            login_screen.ids.email.text = ""
            login_screen.ids.password.text = ""
            login_screen.ids.error_label.text = ""

if __name__ == '__main__':
    BnbApp().run()