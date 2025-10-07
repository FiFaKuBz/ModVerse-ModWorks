import secrets
import time
import requests
from urllib.parse import urlencode
from google.oauth2 import id_token
from google.auth.transport import requests as grequests

class GoogleOAuth:
    """จัดการ Google OAuth flow"""
    
    def __init__(self, client_id, client_secret, redirect_uri, auth_url, token_url):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.auth_url = auth_url
        self.token_url = token_url
    
    def generate_auth_url(self):
        """
        สร้าง URL สำหรับเริ่มต้น OAuth flow
        
        Returns:
            tuple: (auth_url, state, nonce, timestamp)
        """
        state = secrets.token_urlsafe(16)
        nonce = secrets.token_urlsafe(16)
        timestamp = int(time.time())
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "include_granted_scopes": "true",
            "state": state,
            "nonce": nonce,
            "prompt": "consent",
        }
        
        url = f"{self.auth_url}?{urlencode(params)}"
        return url, state, nonce, timestamp
    
    def exchange_code_for_token(self, code):
        """
        แลก authorization code เป็น tokens
        
        Args:
            code (str): Authorization code จาก Google
            
        Returns:
            dict: Response จาก token endpoint
            
        Raises:
            Exception: ถ้า token exchange ล้มเหลว
        """
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        
        response = requests.post(self.token_url, data=data, timeout=10)
        if not response.ok:
            raise Exception(f"Token exchange failed: {response.text}")
        
        return response.json()
    
    def verify_id_token(self, id_token_str):
        """
        ตรวจสอบและ decode ID token
        
        Args:
            id_token_str (str): ID token string
            
        Returns:
            dict: ข้อมูลผู้ใช้จาก ID token
        """
        return id_token.verify_oauth2_token(
            id_token_str,
            grequests.Request(),
            self.client_id
        )