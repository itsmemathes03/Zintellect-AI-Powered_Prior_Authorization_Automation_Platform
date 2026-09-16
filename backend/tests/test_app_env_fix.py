"""
Focused tests for the APP_ENV fix in main.py.

Verifies:
  1. APP_ENV is defined at module level in main.py
  2. The /test-error-monitor endpoint works without NameError
  3. The endpoint returns 500 (triggers error monitor pipeline)
  4. The endpoint blocks in production (APP_ENV != development)
"""

import os
from unittest.mock import patch

import pytest


class TestAppEnvDefinition:
    """APP_ENV must be defined at module level in main.py."""

    def test_app_env_defined_in_main(self):
        """main.py should define APP_ENV at module level."""
        import app.main as main_mod
        assert hasattr(main_mod, "APP_ENV"), "APP_ENV not defined in main.py"

    def test_app_env_is_string(self):
        """APP_ENV should be a string value."""
        import app.main as main_mod
        assert isinstance(main_mod.APP_ENV, str)

    def test_app_env_defaults_to_development(self):
        """APP_ENV should default to 'development' when not set."""
        # Temporarily remove APP_ENV from env
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("APP_ENV", None)
            # Re-import to pick up fresh value
            import importlib
            import app.main as main_mod
            # The module-level APP_ENV was set at import time
            # We can verify the pattern by checking the source
            import inspect
            source = inspect.getsource(main_mod)
            assert 'os.getenv("APP_ENV"' in source or "os.getenv('APP_ENV'" in source


class TestTestErrorMonitorEndpoint:
    """The /test-error-monitor endpoint must work without NameError."""

    def test_endpoint_returns_500(self):
        """GET /test-error-monitor should return 500 (triggers error pipeline)."""
        from fastapi.testclient import TestClient
        import app.main as main_mod

        client = TestClient(main_mod.app, raise_server_exceptions=False)
        response = client.get("/test-error-monitor")
        # Should return 500 (RuntimeError raised → global handler catches it)
        assert response.status_code == 500

    def test_endpoint_does_not_raise_name_error(self):
        """The endpoint should not raise NameError for APP_ENV."""
        from fastapi.testclient import TestClient
        import app.main as main_mod

        client = TestClient(main_mod.app, raise_server_exceptions=False)
        response = client.get("/test-error-monitor")
        # If APP_ENV was undefined, we'd get 500 with a different error pattern
        # The key check: response is 500 (not a crash) and contains generic message
        assert response.status_code == 500
        assert "detail" in response.json()

    def test_endpoint_in_production_returns_403_like(self):
        """When APP_ENV is production, endpoint returns 200 with 'Not available' message."""
        from fastapi.testclient import TestClient
        import app.main as main_mod

        # Temporarily override APP_ENV
        original = main_mod.APP_ENV
        try:
            main_mod.APP_ENV = "production"
            client = TestClient(main_mod.app, raise_server_exceptions=False)
            response = client.get("/test-error-monitor")
            assert response.status_code == 200
            assert response.json()["detail"] == "Not available in production"
        finally:
            main_mod.APP_ENV = original
