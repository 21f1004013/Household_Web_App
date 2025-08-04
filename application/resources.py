from flask_restful import Api, Resource, reqparse
from flask import jsonify
from .models import *
from flask_security import auth_required, roles_required, roles_accepted, current_user
import matplotlib.pyplot as plt
import os

api = Api(prefix='/api')


create_service_parser = reqparse.RequestParser()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Service Fields ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
create_service_parser.add_argument('name', type=str, required=True, help="Service name is required")
create_service_parser.add_argument('price', type=int, required=True, help="Service price is required")
create_service_parser.add_argument('description', type=str)
create_service_parser.add_argument('service_type', type=str)
create_service_parser.add_argument('time_required', type=str)

# create_service_parser.add_argument('service_professional_id', type=int, required=True, help="Professional ID is required")

prof_parser = reqparse.RequestParser()

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ServiceProfessional Fields ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
prof_parser.add_argument('name')
prof_parser.add_argument('service_type', type=str, help="Filter by service type")
prof_parser.add_argument('experience', type=int, help="Filter by minimum experience (years)")
prof_parser.add_argument('is_approved', type=bool, help="Filter by approval status")
prof_parser.add_argument('description', type=str, help="Filter by Description")

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Customer Fields ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
cust_parser = reqparse.RequestParser()
cust_parser.add_argument('name')
cust_parser.add_argument('email')
cust_parser.add_argument('active', type=bool)

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ServiceRequest Fields ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
request_parser = reqparse.RequestParser()

request_parser.add_argument('service_id', type=int, help="Service ID is required")
request_parser.add_argument('service_status', type=str, choices=("requested", "assigned", "closed"), help="Invalid status")
request_parser.add_argument('remarks', type=str)
request_parser.add_argument('date_of_request', type=str)
request_parser.add_argument("professional_id", type=int, help="Professional ID is required")

def roles_list(roles):
    role_list = []
    for role in roles:
        role_list.append(role.name)
    return role_list

class ServiceApi(Resource):

    @auth_required('token')
    def get(self, service_id=None):
        """Fetch all services or a specific service."""
        if service_id:
            service = Service.query.get(service_id)
            if not service:
                return {"message": "Service not found"}, 404
            return {
                "id": service.id,
                "name": service.name,
                "price": service.price,
                "service_type": service.service_type,
                "time_required": service.time_required,
                "description": service.description,
                "service_professional_id": service.service_professional_id,
                "created_at": service.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }, 200

        services = Service.query.all()
        return [{
            "id": s.id,
            "name": s.name,
            "price": s.price,
            "service_type": s.service_type,
            "time_required": s.time_required,
            "description": s.description,
            "service_professional_id": s.service_professional_id,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for s in services], 200

    @auth_required('token')
    @roles_accepted('admin')
    def post(self):
        """Create a new service (only professionals can create services)."""
        args = create_service_parser.parse_args()
        try:
            new_service = Service(
                name=args["name"],
                price=args["price"],
                service_type=args["service_type"],
                time_required=args["time_required"],
                description=args["description"],
                service_professional_id=current_user.id
            )
            db.session.add(new_service)
            db.session.commit()
            return {"message": "Service created successfully", "service_id": new_service.id}, 201
        except Exception as e:
            print(e)
            return {"message": f"Error while creating service: {str(e)}"}, 400

    @auth_required('token')
    @roles_required('admin')
    def put(self, service_id):
        """Update an existing service (only the service's professional can update it)."""
        args = create_service_parser.parse_args()
        service = Service.query.get(service_id)
        
        if not service:
            return {"message": "Service not found"}, 404

        service.name = args["name"]
        service.price = args["price"]
        service.description = args["description"]
        db.session.commit()
        return {"message": "Service updated successfully"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, service_id):
        """Delete a service (only the service's professional can delete it)."""
        service = Service.query.get(service_id)

        if not service:
            return {"message": "Service not found"}, 404

        # Check if the user owns the service
        if service.service_professional_id != current_user.id:
            return {"message": "Unauthorized to delete this service"}, 403

        db.session.delete(service)
        db.session.commit()
        return {"message": "Service deleted successfully"}, 200

api.add_resource(ServiceApi,
                 '/services',           # GET all services
                 '/services/<int:service_id>',  # GET specific service
                 '/services/create',    # POST create new service
                 '/services/update/<int:service_id>',  # PUT update service
                 '/services/delete/<int:service_id>')  # DELETE service


class ServiceProfessionalAPI(Resource):
    @auth_required('token')
    # @roles_accepted('admin')
    def get(self):
        """Fetch a list of service professionals with optional filtering."""
        query = ServiceProfessional.query.all()
        return [{
            "id": prof.id,
            "user_id": prof.user.id,
            "name": prof.user.username if prof.user else "Unknown",  # Fetching username
            "description": prof.description,
            "type": prof.service_type,
            "experience": prof.experience,
            "is_approved": prof.is_approved,
        } for prof in query], 200
        
        
    @auth_required('token')
    # @roles_accepted('admin')
    def put(self, professional_id):
        """Update the approval status of a service professional."""
        data = prof_parser.parse_args()
        professional = ServiceProfessional.query.get_or_404(professional_id)

        # Update approval status
        professional.is_approved = data.get("is_approved", professional.is_approved)
        db.session.commit()

        return {"message": "Status updated successfully", "is_approved": professional.is_approved}, 200

api.add_resource(ServiceProfessionalAPI, '/lala',
                 '/lala/<int:professional_id>/status')


class CustomerListAPI(Resource):
    @auth_required('token')  # Ensure the user is authenticated
    # @roles_accepted('admin')  #admins or professional can access this API
    def get(self):
            # Fetch users who are NOT professionals (customers)
            # customers = User.query.filter(User.is_professional==(False),User.roles.name!='admin').all()
            customers = [user for user in User.query.filter(User.is_professional == False).all() if "admin" not in roles_list(user.roles)]

            return [{
                    "id": customer.id,
                    "username": customer.username,
                    "email": customer.email,
                    "active": customer.active
                    } for customer in customers], 200
            
    @auth_required('token')
    # @roles_accepted('admin')
    def put(self, id):
        """Update the active status of a Customer."""
        data = cust_parser.parse_args()
        customer = User.query.get_or_404(id)

        # Update active status
        customer.active = data.get("active", customer.active)
        db.session.commit()

        return {"message": "Status updated successfully", "active": customer.active}, 200

api.add_resource(CustomerListAPI, "/customers",
                 "/customers/<int:id>/active")

class ServiceRequestAPI(Resource):
    @auth_required('token')
    def get(self, request_id=None):
        """Get all service requests or a specific request"""

        if request_id:
            service_request = ServiceRequest.query.get(request_id)
            if not service_request:
                return {"error": "Service request not found"}, 404

            if 'admin' in [role.name for role in current_user.roles] or \
            service_request.requester_id == current_user.id or \
            service_request.professional_id == current_user.id:
                
                requester_name = User.query.get(service_request.requester_id).username if service_request.requester_id else "Unknown"
                return {
                    "id": service_request.id,
                    "service_id": service_request.service_id,
                    "requester_id": service_request.requester_id,
                    "requester_name":requester_name,
                    "professional_id": service_request.professional_id,
                    "service_status": service_request.service_status,
                    "remarks": service_request.remarks,
                    "date_of_request": service_request.date_of_request.strftime("%Y-%m-%d %H:%M:%S")
                }, 200
            return {"error": "Unauthorized access"}, 403

        # 🛠️ Admins see all requests, Customers see their requests, Professionals see only assigned requests
        if 'admin' in [role.name for role in current_user.roles]:
            requests = ServiceRequest.query.all()
        elif 'professional' in [role.name for role in current_user.roles]:
            requests = ServiceRequest.query.filter_by(professional_id=current_user.id).all()
        else:
            requests = ServiceRequest.query.filter_by(requester_id=current_user.id).all()

        return [{
            "id": req.id,
            "service_id": req.service_id,
            "service_name": Service.query.get(req.service_id).name if req.service_id else "Unknown",
            "requester_id": req.requester_id,
            "requester_name": User.query.get(req.requester_id).username if req.requester_id else "Unknown",
            "professional_id": req.professional_id,
            "professional_name": User.query.get(req.professional_id).username if req.professional_id else "Unknown",
            "service_status": req.service_status,
            "remarks": req.remarks,
            "date_of_request": req.date_of_request.strftime("%Y-%m-%d %H:%M:%S")
        } for req in requests], 200


    @auth_required('token')
    # @roles_accepted('customer')  # Only customers can create requests
    def post(self):
        """Create a new service request"""
        args = request_parser.parse_args()
        service = Service.query.get(args['service_id'])

        if not service:
            return {"error": "Service not found"}, 404
        
        professional_id = args.get('professional_id')
        if not professional_id:
            return {"error": "Please select a professional"}, 400

        new_request = ServiceRequest(
            service_id=args['service_id'],
            requester_id=current_user.id,
            professional_id=args['professional_id'],
            service_status="requested"
        )

        db.session.add(new_request)
        db.session.commit()

        return {"message": "Service request created successfully", "request_id": new_request.id}, 201

    @auth_required('token')
    def put(self, request_id):
        """Update an existing service request"""
        print(1, request_id)
        args = request_parser.parse_args()
        print(args)
        service_request = ServiceRequest.query.get(request_id)

        if not service_request:
            return {"error": "Service request not found"}, 404

        if 'admin' not in [role.name for role in current_user.roles] and service_request.requester_id != current_user.id:
            return {"error": "Unauthorized access"}, 403

        if args['service_status']:
            service_request.service_status = args['service_status']
            if args['service_status'] == "closed":
                service_request.date_of_completion = datetime.utcnow()

        if args['remarks']:
            service_request.remarks = args['remarks']

        db.session.commit()
        return {"message": "Service request updated successfully"}, 200

    @auth_required('token')
    def delete(self, request_id):
        """Delete a service request"""
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return {"error": "Service request not found"}, 404

        if 'admin' not in [role.name for role in current_user.roles] and service_request.requester_id != current_user.id:
            return {"error": "Unauthorized access"}, 403

        db.session.delete(service_request)
        db.session.commit()
        return {"message": "Service request deleted successfully"}, 200

api.add_resource(ServiceRequestAPI,
                 '/service_requests',         # GET all requests, POST new request
                 '/service_requests/<int:request_id>'  # GET, PUT, DELETE specific request
                 )


class ServiceRequestActionAPI(Resource):
    @auth_required('token')
    def patch(self, request_id, action):
        """Handle actions: accept, reject, close"""
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return {"error": "Service request not found"}, 404

        # 🛠️ Ensure only the assigned service professional can take action
        if service_request.professional_id != current_user.id:
            return {"error": "Unauthorized access"}, 403

        if action == "accept":
            if service_request.service_status != "requested":
                return {"error": "Request already processed"}, 400
            service_request.service_status = "Accepted"
        elif action == "reject":
            if service_request.service_status != "requested":
                return {"error": "Request already processed"}, 400
            service_request.service_status = "Rejected"
        elif action == "close":
            if service_request.service_status != "Accepted":
                return {"error": "Only accepted requests can be closed"}, 400
            service_request.service_status = "Completed"
            service_request.date_of_completion = datetime.utcnow()
        else:
            return {"error": "Invalid action"}, 400

        db.session.commit()
        return {"message": f"Service request {action}ed successfully"}, 200


# 🔗 Registering New Endpoints
api.add_resource(ServiceRequestActionAPI,
                 '/service_requests/<int:request_id>/<string:action>')  # Accept, Reject, Close




def generate_graphs(total_customers, total_professionals, pending_requests, completed_requests, service_names, professional_counts):
        if not os.path.exists("static"):
            os.makedirs("static")

        labels = ['Customers', 'Professionals']
        sizes = [total_customers, total_professionals]
        colors = ['blue', 'green']
        plt.figure(figsize=(6,6))
        plt.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=90)
        plt.title('Customers vs Professionals')
        plt.savefig("static/graphs/customers_vs_professionals.png")
        plt.close()

        plt.figure(figsize=(6,4))
        plt.bar(['Pending Requests', 'Completed Requests'], [pending_requests, completed_requests], color=['red', 'green'])
        plt.title('Pending vs Completed Service Requests')
        plt.savefig("static/graphs/pending_vs_completed_requests.png")
        plt.close()

        categories = ['Customers', 'Professionals']
        counts = [total_customers, total_professionals]
        plt.figure(figsize=(6,4))
        plt.bar(categories, counts, color=['blue', 'green'])
        plt.title('Number of Customers and Professionals')
        plt.savefig("static/graphs/num_customers_professionals.png")
        plt.close()

        plt.figure(figsize=(8,5))
        plt.bar(service_names, professional_counts, color='red')
        plt.xlabel('Service Names')
        plt.ylabel('Number of Professionals')
        plt.title('Number of Professionals per Service')
        plt.xticks(rotation=45, ha='right')
        plt.savefig("static/graphs/service_professionals.png")
        plt.close()
        
class AdminStatsAPI(Resource):
    @auth_required('token')
    def get(self):
        total_customers = User.query.filter_by(is_professional=False).count()

        total_professionals = User.query.filter_by(is_professional=True).count()

        pending_requests = ServiceRequest.query.filter(ServiceRequest.service_status != 'Completed').count()
        completed_requests = ServiceRequest.query.filter(ServiceRequest.service_status == 'Completed').count()

        services = db.session.query(Service.service_type, db.func.count(ServiceProfessional.id))\
            .join(ServiceProfessional, Service.service_professional_id == ServiceProfessional.id)\
            .group_by(Service.service_type).all()
        service_names = [service[0] for service in services]
        professional_counts = [service[1] for service in services]

        generate_graphs(total_customers, total_professionals, pending_requests, completed_requests, service_names, professional_counts)

        data = {
            "total_customers": total_customers,
            "total_professionals": total_professionals,
            "pending_requests": pending_requests,
            "completed_requests": completed_requests,
            "graphs": {
                "customers_vs_professionals": "static/customers_vs_professionals.png",
                "pending_vs_completed_requests": "static/pending_vs_completed_requests.png",
                "num_customers_professionals": "static/num_customers_professionals.png",
                "service_professionals": "static/service_professionals.png"
            }
        }

        return jsonify(data)

api.add_resource(AdminStatsAPI, '/admin/stats')
