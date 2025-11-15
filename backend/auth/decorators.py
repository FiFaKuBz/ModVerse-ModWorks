from functools import wraps
from flask import session, redirect, url_for, jsonify, request

def role_required(allowed_roles=None):
    """
    Decorator for routes requiring login (Authentication) and/or specific roles (Authorization/RBAC).

    If not authenticated:
    - If detected as an API request (JSON-like header/path): return 401 JSON error.
    - If detected as a web request: redirect to the login page.
    If authenticated but role is forbidden:
    - Always return 403 JSON error.
    """
    if allowed_roles and not isinstance(allowed_roles, list):
        allowed_roles = [allowed_roles]

    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            # --- Helper to determine request type ---
            is_api_request = (
                request.content_type == "application/json" or
                "application/json" in request.headers.get("Accept", "") or
                request.path.startswith("/api/")
            )

            # 1. Check Login Status (Authentication)
            if "user" not in session:
                if is_api_request:
                    # API request → return JSON 401
                    return jsonify(error="Unauthorized: Login required", message="Please login first"), 401
                else:
                    # Web request → redirect to login
                    return redirect(url_for("auth.login"))
            
            # User is logged in, now check role (Authorization)
            user_role = session["user"].get("role", "user")

            # 2. Check Role (Authorization/RBAC)
            if allowed_roles and user_role not in allowed_roles:
                # Deny access if user's role is not in the allowed list
                # Use 403 Forbidden for insufficient privileges
                return jsonify(error="Forbidden: Insufficient role", message=f"Role '{user_role}' does not have access"), 403
                
            return view(*args, **kwargs)
        return wrapped
    return decorator

# Convenience alias for simple login check (no role required)
def login_required(view):
    """Decorator to require only login, no specific role needed."""
    return role_required()(view)