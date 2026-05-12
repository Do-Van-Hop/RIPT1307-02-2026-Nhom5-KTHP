import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import EMAIL_USER, EMAIL_PASSWORD


def send_email(to_email: str, subject: str, body: str):

    msg = MIMEMultipart()

    msg["From"] = EMAIL_USER
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)

        server.starttls()

        server.login(EMAIL_USER, EMAIL_PASSWORD)

        server.send_message(msg)

        server.quit()

        print("Email sent successfully")

    except Exception as e:
        print("Email error:", e)