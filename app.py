from flask import Flask
from application.database import db
from application.models import User, Role
from application.resources import api
from application.config import LocalDevelopmentConfig
from flask_security import Security,SQLAlchemyUserDatastore
from werkzeug.security import generate_password_hash
from flask_migrate import Migrate
from application.celery_init import celery_init_app
from flask_caching import Cache
from celery.schedules import crontab
from application.tasks import monthly_report, remainder


def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)
    api.init_app(app)
    migrate = Migrate(app, db)
    
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    app.app_context().push()
    return app
app = create_app()
celery = celery_init_app(app)

cache = Cache(app)

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=12, minute=22),
        remainder.s(),
        name='Send Daily Reminders to Service Professionals',
    )
    sender.add_periodic_task(
        crontab(hour=15, minute=30), #, day_of_month='last'
        monthly_report.s(),
        # name='last_day_of_month',
    )

from application.routes import *
with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin", description = "Admin of the app")
    app.security.datastore.find_or_create_role(name = "professional", description = "Professional")
    app.security.datastore.find_or_create_role(name = "customer", description = "Customer")
    db.session.commit()
    
    if not app.security.datastore.find_user(email = "user@admin.com"):
        app.security.datastore.create_user(email = "user@admin.com", username = "Mohit", password = generate_password_hash("1234"), roles =["admin"])
    db.session.commit()   
        
if __name__ == '__main__':
    app.run(debug=True)
    

    
