from functools import wraps
from flask import session, jsonify, redirect, url_for, request

def role_required(allowed_roles=None):
    """
    Decorator for routes requiring login and specific roles.
    
    Args:
        allowed_roles (str or list, optional): The role(s) required 
                                                for access (e.g., 'admin').
                                                If None, only login is required.
    """
    if allowed_roles and not isinstance(allowed_roles, list):
        allowed_roles = [allowed_roles]

    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if "user" not in session:
                # 1. Check Login Status (Authentication)
                if request.method == 'GET' and not request.path.startswith('/api/'):
                    return redirect(url_for("auth.login"))
                # For API calls, return 401 Unauthorized
                return jsonify(error="Unauthorized: Login required"), 401
            
            user_role = session["user"].get("role", "user")

            # 2. Check Role (Authorization/RBAC)
            if allowed_roles and user_role not in allowed_roles:
                # Deny access if user's role is not in the allowed list
                return jsonify(error="Forbidden: Insufficient role"), 403
            
            return view(*args, **kwargs)
        return wrapped
    return decorator

# You can still use the old name for simple login checks:
def login_required(view):
    return role_required()(view)