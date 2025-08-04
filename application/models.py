from .database import db, security
from flask_security import UserMixin, RoleMixin
from datetime import datetime

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    fs_uniquifier  = db.Column(db.String())
    active = db.Column(db.Boolean, nullable=False)
    is_professional = db.Column(db.Boolean, default=False)  # New column to indicate professional status
    roles = db.relationship('Role', secondary='user_roles', backref=db.backref('users', lazy='dynamic'))
    service_professional = db.relationship('ServiceProfessional', uselist=False, back_populates='user') 
    
class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    
class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    role_id = db.Column(db.Integer, db.ForeignKey("role.id"))
    
class ServiceProfessional(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    user = db.relationship('User', back_populates='service_professional')
    
    description = db.Column(db.Text)
    service_type = db.Column(db.String(100), nullable=False)
    experience = db.Column(db.Integer)
    is_approved = db.Column(db.Boolean, default=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    services = db.relationship('Service', back_populates='service_professional')
    service_requests = db.relationship('ServiceRequest', back_populates='professional')
    
    
# Service model
class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    price = db.Column(db.Float, nullable=False)
    service_type = db.Column(db.String, nullable=False)
    time_required = db.Column(db.String, nullable=False)  # In minutes
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Foreign key to link to the service professional who created the service
    service_professional_id = db.Column(db.Integer, db.ForeignKey('service_professional.id'), nullable=False)

    # Relationship with ServiceProfessional
    service_professional = db.relationship('ServiceProfessional', back_populates='services')


# Service Request model
class ServiceRequest(db.Model):
    __tablename__ = 'service_requests'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('service_professional.id'), nullable=True)
    date_of_request = db.Column(db.DateTime, default=datetime.utcnow)
    date_of_completion = db.Column(db.DateTime, nullable=True)
    service_status = db.Column(db.String(20), default="requested")  # "requested", "assigned", "closed"
    remarks = db.Column(db.Text, nullable=True)

    service = db.relationship('Service', backref=db.backref('service_requests', lazy=True))
    requester = db.relationship('User', backref=db.backref('service_requests', lazy=True))
    professional = db.relationship('ServiceProfessional', back_populates='service_requests')

# Review model for customers to post reviews about closed services
class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    service_request_id = db.Column(db.Integer, db.ForeignKey('service_requests.id'), nullable=False, unique=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # The user giving the review
    rating = db.Column(db.Integer, nullable=False)  # Rating (1 to 5)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    service_request = db.relationship('ServiceRequest', backref=db.backref('reviews', lazy=True))
    customer = db.relationship('User', backref=db.backref('customer_reviews', lazy=True))

    
class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    service_request_id = db.Column(db.Integer, db.ForeignKey('service_requests.id'), nullable=False, unique=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Who made the payment
    service_professional_id = db.Column(db.Integer, db.ForeignKey('service_professional.id'), nullable=False)  # Who received the payment
    amount = db.Column(db.Float, nullable=False)  # Payment amount
    payment_status = db.Column(db.String(20), default="pending")  # "pending", "completed", "failed"
    payment_method = db.Column(db.String(50), nullable=False)  # "credit card", "UPI", "cash", etc.
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    service_request = db.relationship('ServiceRequest', backref=db.backref('transactions', lazy=True))
    customer = db.relationship('User', backref=db.backref('customer_transactions', lazy=True))
    service_professional = db.relationship('ServiceProfessional', backref=db.backref('received_transactions', lazy=True))