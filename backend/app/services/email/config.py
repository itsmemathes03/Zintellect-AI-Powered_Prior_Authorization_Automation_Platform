import os
from dataclasses import dataclass


@dataclass
class EmailSettings:
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_app_password: str = ""
    smtp_from_name: str = "Zintellect"
    smtp_from_email: str = ""
    enabled: bool = False

    def __post_init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", self.smtp_host)
        self.smtp_port = int(os.getenv("SMTP_PORT", str(self.smtp_port)))
        self.smtp_username = os.getenv("SMTP_USERNAME", self.smtp_username)
        self.smtp_app_password = os.getenv("SMTP_APP_PASSWORD", self.smtp_app_password)
        self.smtp_from_name = os.getenv("SMTP_FROM_NAME", self.smtp_from_name)
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_from_email)

        # Fallback: use existing EMAIL_ADDRESS/EMAIL_PASSWORD env vars
        if not self.smtp_username:
            self.smtp_username = os.getenv("EMAIL_ADDRESS", "")
        if not self.smtp_app_password:
            self.smtp_app_password = os.getenv("EMAIL_PASSWORD", "")
        if not self.smtp_from_email:
            self.smtp_from_email = self.smtp_username

        self.enabled = bool(self.smtp_username and self.smtp_app_password)


email_settings = EmailSettings()
