from pydantic import BaseModel

class SendEmailRequest(BaseModel):
    subject: str
    body: str