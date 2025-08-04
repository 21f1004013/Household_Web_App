from celery import shared_task
from .models import ServiceRequest, User
from datetime import datetime, timedelta
from mail_service import send_email
import time
import csv
import os
from io import StringIO
from flask_mail import Message
from flask import render_template
from flask_excel import make_response_from_query_sets
from jinja2 import Template
import calendar


@shared_task(ignore_result=False, name="download_csv_result")
def csv_report():
    """Generate a CSV file of closed service requests and store it in user-downloads."""

    # Fetch only closed service requests
    closed_requests = ServiceRequest.query.filter(ServiceRequest.service_status == "Completed").all()

    # Define CSV file path
    file_path = "./user-downloads/closed_service_requests.csv"

    # Ensure directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Write data to CSV file
    with open(file_path, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        # Write headers
        writer.writerow(["Service ID", "Customer", "Professional", "Date", "Remarks"])

        # Write rows
        for req in closed_requests:
            customer = User.query.get(req.requester_id)
            professional = User.query.get(req.professional_id)

            writer.writerow([
                req.service_id,
                customer.username if customer else "Unknown",
                professional.username if professional else "Unknown",
                req.date_of_request.strftime("%Y-%m-%d %H:%M:%S"),
                req.remarks or ""  # Handle empty remarks
            ])

    return file_path  # Return file path for download


# Task 2: Send Monthly Reports

def send_email_with_attachment(to, subject, html_content, attachment_path=None):
    """Wrapper function to send an email with an optional attachment."""
    try:
        print(f"Preparing to send email to: {to}")
        print(f"Subject: {subject}")
        print(f"Attachment: {attachment_path if attachment_path else 'No attachment'}")

        # Call the send_email function
        success = send_email(
            to=to,
            subject=subject,
            content_body=html_content,
            attachment_path=attachment_path
        )

        if success:
            print(f"Email sent successfully to {to}")
            return True
        else:
            print(f"Failed to send email to {to}")
            return False
    except Exception as e:
        print(f"Error in send_email_with_attachment: {e}")
        return False

@shared_task(ignore_result=False, name="monthly_reports")
def monthly_report():
    """Generate and email monthly reports to service professionals."""
    
    today = datetime.utcnow()  # ✅ Ensure UTC timezone consistency
    first_day_last_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
    last_day_last_month = today.replace(day=1) - timedelta(days=1)

    print(f"📅 First Day of Last Month: {first_day_last_month}")
    print(f"📅 Last Day of Last Month: {last_day_last_month}")

    all_users = User.query.all()
    
    # ✅ Filter professionals correctly
    professionals = [user for user in all_users if user.roles and user.roles[0].name.lower() == "professional"]
    
    if not professionals:
        print("⚠️ No professionals found.")
        return "No professionals to send reports to."

    reports_sent = 0

    for professional in professionals:
        print(f"📢 Processing reports for {professional.username}")

        # ✅ Ensure date filtering works correctly
        pending_requests = ServiceRequest.query.filter(
            ServiceRequest.professional_id == professional.id,
            ServiceRequest.date_of_request >= first_day_last_month,
            ServiceRequest.date_of_request <= last_day_last_month,
            ServiceRequest.service_status == "requested"
        ).all()
        print("YYYYYY",pending_requests)
        print(professional.id)

        completed_requests = ServiceRequest.query.filter(
            ServiceRequest.professional_id == professional.id,
            ServiceRequest.date_of_request >= first_day_last_month,
            ServiceRequest.date_of_request <= last_day_last_month,
            ServiceRequest.service_status == "Completed"
        ).all()
        print(completed_requests)
        
        

        total_requests = ServiceRequest.query.filter(
            ServiceRequest.professional_id == professional.id,
            ServiceRequest.date_of_request >= first_day_last_month,
            ServiceRequest.date_of_request <= last_day_last_month
        ).all()

        print(f"➡️ Total Requests: {len(total_requests)} | Completed: {len(completed_requests)} | Pending: {len(pending_requests)}")

        # ✅ Generate CSV only if there are pending requests
        csv_file_path = None
        if pending_requests:
            csv_data = []
            for req in pending_requests:
                customer = User.query.get(req.requester_id)
                csv_data.append({
                    "Service ID": req.service_id,
                    "Customer": customer.username if customer else "Unknown",
                    "Date": req.date_of_request.strftime("%Y-%m-%d"),
                    "Status": req.service_status,
                    "Remarks": req.remarks or "N/A"
                })

            # ✅ Save CSV in a valid directory
            os.makedirs("./reports", exist_ok=True)
            csv_file_path = f"./reports/{professional.username}_monthly_report_{datetime.now().strftime('%Y_%m')}.csv"

            with open(csv_file_path, mode="w", newline="") as file:
                writer = csv.DictWriter(file, fieldnames=csv_data[0].keys())
                writer.writeheader()
                writer.writerows(csv_data)

        # ✅ Load HTML email template
        with open("./templates/monthly_report.html", "r") as html_file:
            template_content = html_file.read()

        template = Template(template_content)
        report_html = template.render(
            professional_name=professional.username,
            total_requests=len(total_requests),
            completed_requests=len(completed_requests),
            pending_requests=len(pending_requests),
            current_year=datetime.now().year
        )

        # ✅ Send email
        email_sent = send_email_with_attachment(
            to=professional.email,
            subject=f"📊 Monthly Service Report - {professional.username}",
            html_content=report_html,
            attachment_path=csv_file_path
        )

        if email_sent:
            reports_sent += 1

    print(f"✅ Monthly reports sent to {reports_sent} professionals.")
    return f"Monthly reports sent to {reports_sent} professionals."

# Task 3: Send Daily Reminders to Service Professionals
@shared_task(ignore_results=False, name="remainder")
def remainder():
    today = datetime.utcnow().date()
    pending_requests = ServiceRequest.query.filter_by(service_status="requested").all()
    
    professionals_to_notify = set(req.professional_id for req in pending_requests)

    for prof_id in professionals_to_notify:
        professional = User.query.get(prof_id)
        print(professional)
        if professional:
            with open("./templates/professional_report.html", "r") as html_file:
                template_content = html_file.read()

            template = Template(template_content)
            report_html = template.render(
                professional_name=professional.username,
                pending_requests=len(pending_requests)
            )
            send_email(to = professional.email,subject = "daily_remainder", content_body = report_html, attachment_path="user-downloads/closed_service_requests.csv")

    return f"Reminders sent to {len(professionals_to_notify)} professionals."