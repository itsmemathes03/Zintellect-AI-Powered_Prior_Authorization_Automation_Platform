import pytest
from app.services.email.renderer import render_template
from app.services.email.schemas import (
    PAStatusUpdateContext,
    SLABreachContext,
    WelcomeContext,
    DocumentProcessedContext,
    AdminErrorContext,
)


class TestEmailRenderer:
    def test_pa_status_update_approved(self):
        ctx = PAStatusUpdateContext(
            request_id="test-req-123",
            patient_name="John Smith",
            procedure_name="MRI Lumbar Spine",
            status="approved",
            notes="Meets all criteria",
        )
        html = render_template("pa_status_update.html", ctx.model_dump())
        assert "test-req-123" in html
        assert "John Smith" in html
        assert "Approved" in html
        assert "{{" not in html
        assert "DOCTYPE" in html

    def test_pa_status_update_denied(self):
        ctx = PAStatusUpdateContext(
            request_id="test-req-456",
            patient_name="Jane Doe",
            procedure_name="CT Scan",
            status="denied",
            notes="Missing documentation",
        )
        html = render_template("pa_status_update.html", ctx.model_dump())
        assert "Denied" in html
        assert "Jane Doe" in html
        assert "{{" not in html

    def test_sla_breach(self):
        ctx = SLABreachContext(
            request_id="test-req-789",
            patient_name="Bob Wilson",
            elapsed_time="25.5 hours",
            sla_deadline="2026-08-20T10:00:00",
        )
        html = render_template("sla_breach_alert.html", ctx.model_dump())
        assert "test-req-789" in html
        assert "25.5 hours" in html
        assert "{{" not in html

    def test_welcome(self):
        ctx = WelcomeContext(
            user_name="Dr. Smith",
            role="doctor",
            email="doctor@test.com",
        )
        html = render_template("welcome.html", ctx.model_dump())
        assert "Dr. Smith" in html
        assert "{{" not in html

    def test_document_processed(self):
        ctx = DocumentProcessedContext(
            document_name="clinical_notes.pdf",
            procedure_name="MRI Lumbar Spine",
            extracted_fields={"diagnosis": "Low back pain", "symptoms": ["pain"]},
        )
        html = render_template("document_processed.html", ctx.model_dump())
        assert "clinical_notes.pdf" in html
        assert "MRI Lumbar Spine" in html
        assert "{{" not in html

    def test_admin_error(self):
        ctx = AdminErrorContext(
            error_summary="OCR pipeline timeout",
            endpoint="/submit-request",
            timestamp="2026-08-23T10:30:00",
        )
        html = render_template("admin_error_alert.html", ctx.model_dump())
        assert "OCR pipeline timeout" in html
        assert "2026-08-23T10:30:00" in html
        assert "{{" not in html

    def test_all_templates_render_without_error(self):
        templates = [
            ("pa_status_update.html", PAStatusUpdateContext(
                request_id="x", patient_name="x", procedure_name="x", status="pending"
            ).model_dump()),
            ("sla_breach_alert.html", SLABreachContext(
                request_id="x", patient_name="x",
                elapsed_time="1 hour", sla_deadline="2026-01-01"
            ).model_dump()),
            ("welcome.html", WelcomeContext(
                user_name="x", role="x", email="x"
            ).model_dump()),
            ("document_processed.html", DocumentProcessedContext(
                document_name="x", procedure_name="x"
            ).model_dump()),
            ("admin_error_alert.html", AdminErrorContext(
                error_summary="x", endpoint="x", timestamp="x"
            ).model_dump()),
        ]
        for name, ctx in templates:
            html = render_template(name, ctx)
            assert len(html) > 100, f"Template {name} rendered too short"
            assert "{{" not in html, f"Template {name} has unrendered placeholders"
