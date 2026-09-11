"""
Locust load test for Zintellect prior-authorization platform.

Install: pip install locust
Run:     locust -f tests/locustfile.py --host=http://localhost:8000
Web UI:  http://localhost:8089

Tests critical paths:
  - Health check
  - Admin login + dashboard reads
  - Provider login + requests list
  - Patient login + profile
  - Request submission flow
"""

import os
import json
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner


class AdminUser(HttpUser):
    """Simulates admin browsing the dashboard."""
    weight = 2
    wait_time = between(1, 3)
    host = os.getenv("LOCUST_HOST", "http://localhost:8000")

    def on_start(self):
        resp = self.client.post(
            "/admin/login",
            json={"email": "admin@gmail.com", "password": "admin123"},
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        else:
            self.token = None

    @task(5)
    def health_check(self):
        self.client.get("/")

    @task(3)
    def get_users(self):
        if self.token:
            self.client.get(
                "/admin/users",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/admin/users",
            )

    @task(3)
    def get_policies(self):
        if self.token:
            self.client.get(
                "/admin/policies",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/admin/policies",
            )

    @task(2)
    def get_analytics(self):
        if self.token:
            self.client.get(
                "/admin/analytics",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/admin/analytics",
            )

    @task(2)
    def get_audit_logs(self):
        if self.token:
            self.client.get(
                "/admin/audit",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/admin/audit",
            )

    @task(1)
    def get_settings(self):
        if self.token:
            self.client.get(
                "/admin/settings",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/admin/settings",
            )


class ProviderUser(HttpUser):
    """Simulates provider browsing requests and profiles."""
    weight = 4
    wait_time = between(1, 5)
    host = os.getenv("LOCUST_HOST", "http://localhost:8000")

    def on_start(self):
        resp = self.client.post(
            "/provider/login",
            json={"email": "prov@test.com", "password": "pass123"},
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        else:
            self.token = None

    @task(4)
    def list_requests(self):
        if self.token:
            self.client.get(
                "/provider/requests",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/provider/requests",
            )

    @task(3)
    def get_stats(self):
        if self.token:
            self.client.get(
                "/provider/stats",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/provider/stats",
            )

    @task(2)
    def get_notifications(self):
        if self.token:
            self.client.get(
                "/provider/notifications",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/provider/notifications",
            )

    @task(1)
    def get_profile(self):
        if self.token:
            self.client.get(
                "/provider/profile",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/provider/profile",
            )

    @task(1)
    def get_email_history(self):
        if self.token:
            self.client.get(
                "/provider/email-history",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/provider/email-history",
            )


class PatientUser(HttpUser):
    """Simulates patient browsing their requests."""
    weight = 3
    wait_time = between(2, 6)
    host = os.getenv("LOCUST_HOST", "http://localhost:8000")

    def on_start(self):
        resp = self.client.post(
            "/patient/login",
            json={"email": "pat@test.com", "password": "pass123"},
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        else:
            self.token = None

    @task(4)
    def list_requests(self):
        if self.token:
            self.client.get(
                "/patient/requests",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/patient/requests",
            )

    @task(2)
    def get_stats(self):
        if self.token:
            self.client.get(
                "/patient/stats",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/patient/stats",
            )

    @task(2)
    def get_notifications(self):
        if self.token:
            self.client.get(
                "/patient/notifications",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/patient/notifications",
            )

    @task(1)
    def get_profile(self):
        if self.token:
            self.client.get(
                "/patient/profile",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/patient/profile",
            )


class RequestSubmissionUser(HttpUser):
    """Simulates the full submit-request flow."""
    weight = 1
    wait_time = between(3, 8)
    host = os.getenv("LOCUST_HOST", "http://localhost:8000")

    def on_start(self):
        resp = self.client.post(
            "/provider/login",
            json={"email": "prov@test.com", "password": "pass123"},
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        else:
            self.token = None

    @task(2)
    def submit_request(self):
        if self.token:
            payload = {
                "patientName": f"Load Test Patient {self.environment.runner.user_count}",
                "patientId": f"P-LT-{self.environment.runner.user_count}",
                "diagnosis": "Load test diagnosis",
                "procedureCode": "MRI",
                "doctorName": "Dr LoadTest",
                "insuranceProvider": "Test Insurance",
                "insuranceId": f"INS-LT-{self.environment.runner.user_count}",
                "clinicalNotes": "Load test clinical notes for authorization request.",
            }
            self.client.post(
                "/submit-request",
                headers={"Authorization": f"Bearer {self.token}"},
                json=payload,
                name="/submit-request",
            )

    @task(1)
    def upload_policy(self):
        if self.token:
            self.client.post(
                "/upload-policy",
                headers={"Authorization": f"Bearer {self.token}"},
                data={"name": "Load Test Policy", "provider_id": "load-test"},
                files={"file": ("test.txt", b"load test policy content", "text/plain")},
                name="/upload-policy",
            )


class DoctorUser(HttpUser):
    """Simulates doctor browsing requests and patients."""
    weight = 2
    wait_time = between(2, 5)
    host = os.getenv("LOCUST_HOST", "http://localhost:8000")

    def on_start(self):
        resp = self.client.post(
            "/doctor/login",
            json={"email": "dr@test.com", "password": "pass123"},
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token")
        else:
            self.token = None

    @task(3)
    def list_requests(self):
        if self.token:
            self.client.get(
                "/doctor/requests",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/doctor/requests",
            )

    @task(2)
    def list_patients(self):
        if self.token:
            self.client.get(
                "/doctor/patients",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/doctor/patients",
            )

    @task(1)
    def get_stats(self):
        if self.token:
            self.client.get(
                "/doctor/stats",
                headers={"Authorization": f"Bearer {self.token}"},
                name="/doctor/stats",
            )


class PublicEndpointsUser(HttpUser):
    """Simulates unauthenticated traffic on public endpoints."""
    weight = 2
    wait_time = between(1, 3)
    host = os.getenv("LOCUST_HOST", "http://localhost:8000")

    @task(3)
    def health_check(self):
        self.client.get("/")

    @task(1)
    def verify_insurance(self):
        self.client.post(
            "/verify-insurance",
            json={"insurance_id": "load-test-id"},
            name="/verify-insurance",
        )

    @task(1)
    def get_provider_policies(self):
        self.client.get(
            "/provider-policies/load-test-provider",
            name="/provider-policies",
        )
