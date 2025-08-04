from flask import request, jsonify, Response
from flask import current_app as app, jsonify, render_template, session, send_from_directory,send_file
from flask_security import auth_required, roles_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from .models import *
from celery.result import AsyncResult
from application.tasks import *
from flask import send_file

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   Task Route    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~``
@app.route('/get-task/<task_id>')
def get_task(task_id):
    result = AsyncResult(task_id)
    if result.ready():
        return jsonify({'result': result.result}), 200

    else:
        return 'task is not done yet', 405

@app.route('/api/export', methods=['GET'])
def export_csv():
    task = csv_report.apply_async()
    return jsonify({"task_id": task.id}), 202  # Return task ID

@app.route('/api/download/<task_id>', methods=['GET'])
def download_csv(task_id):
    task_result = AsyncResult(task_id)

    if task_result.state == "SUCCESS":
        file_path = task_result.result
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True, mimetype="text/csv")
        else:
            return jsonify({'error': 'File not found'}), 404
    elif task_result.state == "PENDING":
        return jsonify({'status': 'PENDING'}), 202
    else:
        return jsonify({'error': 'Task failed'}), 500
    
@app.route('/api/csv_result/<id>') #this route will be called by the frontend to check the status of the task
def csv_result(id):
    res = AsyncResult(id)
    if res.ready():
        return send_from_directory("static",res.result)
    else:
        return 'task is not done yet', 405

##################################################################################################################################
# Home page
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/main_login', methods=['POST'])
def login():
    credentials = request.get_json()
    user = app.security.datastore.find_user(email=credentials["email"])
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not check_password_hash(user.password, credentials["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = user.get_auth_token()
    return jsonify({"user_id": user.id, "user_name": user.username, "token": token, "role": user.roles[0].name}), 200


@app.route('/api/cust_register', methods=['POST'])
def cust_register():
    credentials = request.get_json('credentials')
    if not app.security.datastore.find_user(email=credentials["email"]):
        hashed_password = generate_password_hash(credentials["password"], method='pbkdf2:sha256')  # Hash password

        app.security.datastore.create_user(email=credentials["email"],
                                            username = credentials["username"],
                                            password=hashed_password,
                                            roles = ["customer"])
        app.security.datastore.commit()
        return jsonify({"message": "Customer created successfully"}), 201
    else:
        return jsonify({"error": "Customer already exists"}), 409
    
@app.route('/api/prof_register', methods=['POST'])
def prof_register():
    credentials = request.get_json()

    # Check if user already exists
    if app.security.datastore.find_user(email=credentials["email"]):
        return jsonify({"error": "User already exists"}), 409
    hashed_password = generate_password_hash(credentials["password"], method='pbkdf2:sha256')  # Hash password

    # Create a new user with the role of "professional"
    user = app.security.datastore.create_user(
        email=credentials["email"],
        username=credentials["username"],
        password=hashed_password,
        roles=["professional"],
        is_professional = True
    )
    db.session.commit()

    # Create an associated ServiceProfessional entry
    professional = ServiceProfessional(
        user_id=user.id,
        description=credentials.get("description", ""),
        service_type=credentials["service_type"],
        experience=credentials.get("experience", 0),
        is_approved=False  # Admin approval required
    )
    db.session.add(professional)
    db.session.commit()

    return jsonify({"message": "Service Professional registered successfully"}), 201

from flask import jsonify
from flask_security import auth_required, roles_required
import requests

@app.route('/api/admin_home', methods=['GET'])
@auth_required('token')  # Ensures only authenticated users can access
@roles_required('admin')  # Restricts access to admins only
def admin_home():
    try:
        # Fetch Customers
        customers_response = requests.get("http://127.0.0.1:5000/api/admin/customers")
        customers = customers_response.json() if customers_response.status_code == 200 else []

        # Fetch Service Professionals
        professionals_response = requests.get("http://127.0.0.1:5000/api/service-professionals")
        professionals = professionals_response.json() if professionals_response.status_code == 200 else []

        return jsonify({
            "customers": customers,
            "service_professionals": professionals
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
  


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()  # Remove all session data
    return jsonify({"message": "Logged out successfully"}), 200