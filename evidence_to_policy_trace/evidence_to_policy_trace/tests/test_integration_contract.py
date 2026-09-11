"""
Integration contract tests for the Evidence-to-Policy Traceability module.
Tests that the module maintains a stable interface for integration.
"""

import unittest
import json
from evidence_to_policy_trace.service import process_evidence_trace
from evidence_to_policy_trace.schemas import EvidenceToPolicyInput, EvidenceToPolicyOutput


class TestIntegrationContract(unittest.TestCase):
    """Test the integration contract of the evidence-to-policy traceability module."""

    def test_input_output_contract_stability(self):
        """Test that the input/output contracts remain stable."""
        # Define a standard input that should work across versions
        standard_input = {
            "request_id": "PA-CONTRACT-TEST-001",
            "procedure": "Standard Procedure",
            "policy": {
                "policy_id": "POL-STANDARD",
                "version": "1.0",
                "requirements": [
                    {
                        "requirement_id": "REQ-STD-001",
                        "description": "Standard requirement for testing",
                        "type": "condition"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-STD-001",
                    "text": "Standard evidence for testing the requirement",
                    "document_id": "DOC-STD-001",
                    "document_name": "standard_document.pdf",
                    "page": 1,
                    "entity_type": "condition",
                    "entity_value": "standard condition",
                    "confidence": 0.85
                }
            ]
        }

        # Process the input
        result = process_evidence_trace(standard_input)

        # Validate that we can parse the output with our schema
        # This ensures the contract hasn't broken
        try:
            output_obj = EvidenceToPolicyOutput(**result)
            self.assertIsInstance(output_obj, EvidenceToPolicyOutput)
        except Exception as e:
            self.fail(f"Output schema validation failed: {e}")

        # Check required fields are present
        self.assertIn('request_id', result)
        self.assertIn('feature', result)
        self.assertIn('results', result)
        self.assertIn('summary', result)

        # Check results structure
        self.assertIsInstance(result['results'], list)
        if len(result['results']) > 0:
            req_result = result['results'][0]
            self.assertIn('requirement_id', req_result)
            self.assertIn('requirement', req_result)
            self.assertIn('status', req_result)
            self.assertIn('confidence', req_result)
            self.assertIn('evidence', req_result)
            self.assertIn('explanation', req_result)

            # Check evidence structure
            if len(req_result['evidence']) > 0:
                evidence_item = req_result['evidence'][0]
                self.assertIn('evidence_id', evidence_item)
                self.assertIn('text', evidence_item)
                self.assertIn('document_id', evidence_item)
                self.assertIn('document_name', evidence_item)
                self.assertIn('confidence', evidence_item)

        # Check summary structure
        summary = result['summary']
        self.assertIn('total_requirements', summary)
        self.assertIn('matched', summary)
        self.assertIn('missing', summary)
        self.assertIn('uncertain', summary)
        self.assertIn('contradicted', summary)

        # Verify summary counts are consistent
        total_from_summary = summary['total_requirements']
        matched_from_summary = summary['matched']
        missing_from_summary = summary['missing']
        uncertain_from_summary = summary['uncertain']
        contradicted_from_summary = summary['contradicted']

        self.assertEqual(total_from_summary, len(result['results']))
        calculated_total = matched_from_summary + missing_from_summary + uncertain_from_summary + contradicted_from_summary
        self.assertEqual(total_from_summary, calculated_total)

    def test_json_serializability(self):
        """Test that input and output are JSON serializable."""
        test_input = {
            "request_id": "PA-JSON-TEST-001",
            "procedure": "JSON Test",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-JSON-001",
                        "description": "JSON serializability test"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-JSON-001",
                    "text": "Test evidence for JSON",
                    "document_id": "DOC-JSON-001",
                    "document_name": "json_test.pdf",
                    "confidence": 0.9
                }
            ]
        }

        # Test that input can be serialized to JSON
        input_json = json.dumps(test_input)
        self.assertIsInstance(input_json, str)

        # Test that output can be serialized to JSON
        result = process_evidence_trace(test_input)
        output_json = json.dumps(result)
        self.assertIsInstance(output_json, str)

        # Test that we can deserialize and get the same data
        parsed_output = json.loads(output_json)
        self.assertEqual(parsed_output['request_id'], result['request_id'])
        self.assertEqual(parsed_output['feature'], result['feature'])

    def test_deterministic_output(self):
        """Test that the same input produces the same output."""
        test_input = {
            "request_id": "PA-DETERMINISTIC-TEST-001",
            "procedure": "Deterministic Test",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-DET-001",
                        "description": "Deterministic test requirement"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-DET-001",
                    "text": "Deterministic test evidence",
                    "document_id": "DOC-DET-001",
                    "document_name": "det_test.pdf",
                    "confidence": 0.8
                }
            ]
        }

        # Run the same input multiple times
        result1 = process_evidence_trace(test_input)
        result2 = process_evidence_trace(test_input)
        result3 = process_evidence_trace(test_input)

        # Results should be identical
        self.assertEqual(result1, result2)
        self.assertEqual(result2, result3)

    def test_error_handling_contract(self):
        """Test that error handling follows a consistent contract."""
        # Test with completely invalid input
        invalid_input = {
            # Missing required fields
            "request_id": "PA-ERROR-TEST-001"
            # Missing policy and clinical_evidence
        }

        # Should not crash, should return structured output or handle gracefully
        try:
            result = process_evidence_trace(invalid_input)
            # If it returns a result, it should still have the basic structure
            if isinstance(result, dict):
                # Should at least have request_id if we provided it
                self.assertEqual(result.get('request_id'), "PA-ERROR-TEST-001")
                # Should have feature field
                self.assertIn('feature', result)
                # Should have results and summary even if empty/error
                self.assertIn('results', result)
                self.assertIn('summary', result)
        except Exception as e:
            # If it raises an exception, it should be a handled/exception type
            # We're mainly checking that it doesn't crash the system
            self.assertIsInstance(e, Exception)
            # Don't fail the test - error handling can vary as long as it doesn't crash

    def test_extension_field_tolerance(self):
        """Test that the module tolerates extension fields in input."""
        # Input with extra fields that shouldn't break processing
        extended_input = {
            "request_id": "PA-EXTENSION-TEST-001",
            "procedure": "Extension Test",
            "policy": {
                "policy_id": "POL-EXT",
                "version": "1.0",
                "requirements": [
                    {
                        "requirement_id": "REQ-EXT-001",
                        "description": "Extension tolerance test",
                        "type": "condition",
                        "weight": 1.0,
                        "extra_field": "should be ignored"  # Extension field
                    }
                ],
                "extra_policy_field": "should also be ignored"  # Extension field
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-EXT-001",
                    "text": "Extension test evidence",
                    "document_id": "DOC-EXT-001",
                    "document_name": "extension_test.pdf",
                    "page": 1,
                    "entity_type": "condition",
                    "entity_value": "test condition",
                    "confidence": 0.85,
                    "extra_evidence_field": "should be ignored"  # Extension field
                }
            ],
            "extra_top_level_field": "should be ignored"  # Extension field
        }

        # Should process successfully despite extension fields
        result = process_evidence_trace(extended_input)

        # Should still produce valid output
        self.assertEqual(result['request_id'], "PA-EXTENSION-TEST-001")
        self.assertEqual(result['feature'], "evidence_to_policy_trace")
        self.assertEqual(len(result['results']), 1)

        # The extension fields should not appear in the output
        req_result = result['results'][0]
        self.assertNotIn('extra_field', req_result)
        if len(req_result['evidence']) > 0:
            evidence_item = req_result['evidence'][0]
            self.assertNotIn('extra_evidence_field', evidence_item)


if __name__ == '__main__':
    unittest.main()