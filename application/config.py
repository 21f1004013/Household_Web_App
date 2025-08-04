class Config():
    DEBUG = False
    SQLAlCHEMY_TRACK_MODIFICATION = True
    
class LocalDevelopmentConfig(Config):
    #configuration
    SQLALCHEMY_DATABASE_URI = "sqlite:///db.sqlite3"
    DEBUG = True
    
    #configuration for security
    SECRET_KEY = "your-secret-key"
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_PASSWORD_SALT = "your-password-salt"
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE = 1800  # Token expires in 1/2 hour
    