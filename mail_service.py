from email.mime.multipart import  MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from email.mime.base import MIMEBase
from email import encoders
import os
from jinja2 import Template




# SMTP configuration for MailHog
SMTP_SERVER = 'localhost'
SMTP_PORT = 1025
SENDER_EMAIL = 'user@admin.com'
SENDER_PASSWORD = ''  # No password needed for MailHog


def send_email(to, subject, content_body, attachment_path=None):
    """
    Send an email with optional attachment using smtplib and MailHog.

    Args:
        to (str): Recipient's email address.
        subject (str): Email subject.
        content_body (str): HTML content for the email body.
        attachment_path (str, optional): Path to the file to be attached.
    """
    try:
        # Create the email
        msg = MIMEMultipart()
        msg["To"] = to
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg.attach(MIMEText(content_body, 'html'))

        # Add attachment if provided
        if attachment_path:
            if os.path.exists(attachment_path):
                with open(attachment_path, 'rb') as file:
                    attachment = MIMEBase('application', 'octet-stream')
                    attachment.set_payload(file.read())
                    encoders.encode_base64(attachment)
                    attachment.add_header(
                        'Content-Disposition',
                        f'attachment; filename={os.path.basename(attachment_path)}'
                    )
                    msg.attach(attachment)
            else:
                print(f"Error: Attachment file not found at {attachment_path}")
                return False

        # Connect to SMTP server and send the email
        with smtplib.SMTP(host=SMTP_SERVER, port=SMTP_PORT) as client:
            client.send_message(msg=msg)
        print(f"Email sent successfully to {to}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False