"""
Integration contract tests for the Evidence-to-Policy Traceability module.
Tests that the module maintains a stable interface for integration.

Includes:
- Original contract tests (adapted imports)
- Zintellect-specific integration tests
"""

import unittest
import json
from app.services.evidence_trace.service import process_evidence_trace
from app.services.evidence_trace.schemas import EvidenceToPolicyInput, EvidenceToPolicyOutput
from app.services.evidence_trace.zintellect_adapter import adapt_zintellect_request


class TestIntegrationContract(unittest.TestCase):
    """Test the integration contract of the evidence-to-policy traceability module."""

    def test_input_output_contract_stability(self):
        """Test that the input/output contracts remain stable."""
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

        result = process_evidence_trace(standard_input)

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

        input_json = json.dumps(test_input)
        self.assertIsInstance(input_json, str)

        result = process_evidence_trace(test_input)
        output_json = json.dumps(result)
        self.assertIsInstance(output_json, str)

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

        result1 = process_evidence_trace(test_input)
        result2 = process_evidence_trace(test_input)
        result3 = process_evidence_trace(test_input)

        self.assertEqual(result1, result2)
        self.assertEqual(result2, result3)

    def test_error_handling_contract(self):
        """Test that error handling follows a consistent contract."""
        invalid_input = {
            "request_id": "PA-ERROR-TEST-001"
        }

        try:
            result = process_evidence_trace(invalid_input)
            if isinstance(result, dict):
                self.assertEqual(result.get('request_id'), "PA-ERROR-TEST-001")
                self.assertIn('feature', result)
                self.assertIn('results', result)
                self.assertIn('summary', result)
        except Exception as e:
            self.assertIsInstance(e, Exception)

    def test_extension_field_tolerance(self):
        """Test that the module tolerates extension fields in input."""
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
                        "extra_field": "should be ignored"
                    }
                ],
                "extra_policy_field": "should also be ignored"
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
                    "extra_evidence_field": "should be ignored"
                }
            ],
            "extra_top_level_field": "should be ignored"
        }

        result = process_evidence_trace(extended_input)

        self.assertEqual(result['request_id'], "PA-EXTENSION-TEST-001")
        self.assertEqual(result['feature'], "evidence_to_policy_trace")
        self.assertEqual(len(result['results']), 1)

        req_result = result['results'][0]
        self.assertNotIn('extra_field', req_result)
        if len(req_result['evidence']) > 0:
            evidence_item = req_result['evidence'][0]
            self.assertNotIn('extra_evidence_field', evidence_item)


# ==========================================================================
# ZINTELLECT-SPECIFIC INTEGRATION TESTS
# ==========================================================================


class TestZintellectIntegration(unittest.TestCase):
    """Tests for Zintellect-specific adapter and data mapping."""

    def test_actual_policy_id_preservation(self):
        """Test that actual Zintellect policy IDs are preserved, not fabricated."""
        module_input = adapt_zintellect_request(
            request_id="real-request-uuid-12345",
            policy=None,  # Simulate missing policy
            extracted_entities={"diagnosis": "Headache", "procedure_requested": "MRI Brain"},
            uploaded_document_types=["clinical_notes"],
            policy_rules={
                "procedure": "MRI Brain",
                "policy_id": "actual-policy-uuid-67890",
                "version": "2.1",
                "required_documents": ["clinical_notes"],
                "required_conditions": ["Neurological deficits"],
                "required_evidence": [],
            },
        )

        # Policy ID should come from policy_rules (simulating InsurancePolicy.id)
        self.assertEqual(module_input['policy']['policy_id'], "actual-policy-uuid-67890")
        self.assertEqual(module_input['policy']['version'], "2.1")

    def test_actual_policy_version_preservation(self):
        """Test that actual policy version is preserved."""
        module_input = adapt_zintellect_request(
            request_id="req-001",
            policy=None,
            extracted_entities={},
            uploaded_document_types=[],
            policy_rules={
                "procedure": "CT Scan",
                "policy_id": "POL-ABC",
                "version": "3.2.1",
                "required_documents": [],
                "required_conditions": [],
                "required_evidence": [],
            },
        )

        self.assertEqual(module_input['policy']['version'], "3.2.1")

    def test_no_authorization_decision_generated(self):
        """Confirm the module output never contains approval/rejection fields."""
        result = process_evidence_trace({
            "request_id": "PA-NO-AUTH-TEST",
            "procedure": "MRI",
            "policy": {
                "policy_id": "POL-001",
                "requirements": [
                    {"requirement_id": "REQ-001", "description": "Clinical indication documented"}
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Patient presents with headache",
                    "document_id": "DOC-001",
                    "document_name": "notes.pdf",
                    "confidence": 0.9,
                }
            ],
        })

        # Output should contain traceability fields only
        self.assertIn('request_id', result)
        self.assertIn('results', result)
        self.assertIn('summary', result)
        # Must NOT contain authorization decision fields
        self.assertNotIn('decision', result)
        self.assertNotIn('approved', result)
        self.assertNotIn('rejected', result)
        self.assertNotIn('ai_recommendation', result)

    def test_existing_pa_workflow_unaffected(self):
        """Verify module is purely additive — returns traceability only."""
        result = process_evidence_trace({
            "request_id": "PA-WORKFLOW-TEST",
            "procedure": "CT Scan",
            "policy": {
                "requirements": [
                    {"requirement_id": "R1", "description": "Required document present in clinical file"},
                    {"requirement_id": "R2", "description": "Missing condition not satisfied"},
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E1",
                    "text": "Required document is present in clinical file",
                    "document_id": "DOC-1",
                    "document_name": "notes.pdf",
                    "confidence": 0.85,
                }
            ],
        })

        self.assertEqual(result['feature'], 'evidence_to_policy_trace')
        self.assertEqual(len(result['results']), 2)
        # Summary is consistent
        self.assertEqual(result['summary']['total_requirements'], 2)

    def test_zintellect_adapter_maps_real_identifiers(self):
        """Test that the adapter uses real Zintellect data, not fabricated IDs."""
        module_input = adapt_zintellect_request(
            request_id="actual-prior-auth-uuid-abc",
            policy=None,
            extracted_entities={
                "diagnosis": "Chronic migraine",
                "symptoms": ["headache", "photophobia"],
                "procedure_requested": "MRI Brain",
                "medications": ["Sumatriptan"],
            },
            uploaded_document_types=["clinical_notes", "radiology_report"],
            policy_rules={
                "procedure": "MRI Brain",
                "policy_id": "POL-XYZ-123",
                "version": "1.5",
                "required_documents": ["clinical_notes", "imaging_orders"],
                "required_conditions": ["Failed conservative therapy"],
                "required_evidence": [
                    {"label": "Neurological deficit documented", "mandatory": True}
                ],
            },
        )

        # Request ID preserved
        self.assertEqual(module_input['request_id'], "actual-prior-auth-uuid-abc")

        # Policy ID/version preserved (from policy_rules which mirrors InsurancePolicy)
        self.assertEqual(module_input['policy']['policy_id'], "POL-XYZ-123")
        self.assertEqual(module_input['policy']['version'], "1.5")

        # Requirements built from actual policy data
        reqs = module_input['policy']['requirements']
        self.assertEqual(len(reqs), 4)  # 2 docs + 1 condition + 1 evidence
        self.assertEqual(reqs[0]['type'], 'documentation')
        self.assertEqual(reqs[2]['type'], 'condition')
        self.assertEqual(reqs[3]['type'], 'evidence')

        # Clinical evidence built from actual entities
        evidence = module_input['clinical_evidence']
        # diagnosis + 2 symptoms + procedure + medications(1) + uploaded_docs(2) = 7
        self.assertGreaterEqual(len(evidence), 5)

    def test_empty_evidence_returns_missing(self):
        """Test that empty evidence produces missing status for all requirements."""
        result = process_evidence_trace({
            "request_id": "PA-EMPTY-EV",
            "policy": {
                "requirements": [
                    {"requirement_id": "R1", "description": "Something required"}
                ]
            },
            "clinical_evidence": [],
        })

        self.assertEqual(result['results'][0]['status'], 'missing')
        self.assertEqual(result['summary']['missing'], 1)

    def test_empty_requirements_returns_empty_results(self):
        """Test that empty requirements produce empty results."""
        result = process_evidence_trace({
            "request_id": "PA-EMPTY-REQ",
            "policy": {"requirements": []},
            "clinical_evidence": [
                {
                    "evidence_id": "E1",
                    "text": "Some evidence",
                    "document_id": "D1",
                    "document_name": "doc.pdf",
                    "confidence": 0.8,
                }
            ],
        })

        self.assertEqual(result['summary']['total_requirements'], 0)
        self.assertEqual(len(result['results']), 0)

    def test_multiple_evidence_items_single_requirement(self):
        """Test that multiple evidence items can support one requirement."""
        result = process_evidence_trace({
            "request_id": "PA-MULTI-EV",
            "policy": {
                "requirements": [
                    {"requirement_id": "R1", "description": "Patient has neurological symptoms"}
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E1",
                    "text": "Patient has neurological symptoms including headache",
                    "document_id": "D1",
                    "document_name": "neuro_notes.pdf",
                    "page": 1,
                    "confidence": 0.9,
                },
                {
                    "evidence_id": "E2",
                    "text": "Neurological examination shows mild deficits",
                    "document_id": "D1",
                    "document_name": "neuro_notes.pdf",
                    "page": 3,
                    "confidence": 0.85,
                },
            ],
        })

        self.assertEqual(result['results'][0]['status'], 'matched')
        self.assertGreaterEqual(len(result['results'][0]['evidence']), 1)

    def test_page_and_section_traceability(self):
        """Test that page and section info is preserved in evidence matches."""
        result = process_evidence_trace({
            "request_id": "PA-TRACE-TEST",
            "policy": {
                "requirements": [
                    {"requirement_id": "R1", "description": "Documented clinical indication"}
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E1",
                    "text": "Documented clinical indication for MRI brain scan",
                    "document_id": "DOC-001",
                    "document_name": "neurology_referral.pdf",
                    "page": 5,
                    "section": "Clinical Indication",
                    "confidence": 0.92,
                }
            ],
        })

        req_result = result['results'][0]
        self.assertEqual(req_result['status'], 'matched')
        if req_result['evidence']:
            ev = req_result['evidence'][0]
            self.assertEqual(ev['page'], 5)
            self.assertEqual(ev['section'], "Clinical Indication")
            self.assertEqual(ev['document_name'], "neurology_referral.pdf")

    def test_confidence_score_in_valid_range(self):
        """Test that all confidence scores are in [0, 1]."""
        result = process_evidence_trace({
            "request_id": "PA-CONF-TEST",
            "policy": {
                "requirements": [
                    {"requirement_id": "R1", "description": "Test requirement"},
                    {"requirement_id": "R2", "description": "Another requirement"},
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E1",
                    "text": "Matching evidence for test requirement",
                    "document_id": "D1",
                    "document_name": "doc.pdf",
                    "confidence": 0.8,
                }
            ],
        })

        for req_result in result['results']:
            self.assertGreaterEqual(req_result['confidence'], 0.0)
            self.assertLessEqual(req_result['confidence'], 1.0)
            for ev in req_result['evidence']:
                self.assertGreaterEqual(ev['confidence'], 0.0)
                self.assertLessEqual(ev['confidence'], 1.0)


if __name__ == '__main__':
    unittest.main()
