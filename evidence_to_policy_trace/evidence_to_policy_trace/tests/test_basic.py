"""
Basic unit tests for the Evidence-to-Policy Traceability module.
"""

import unittest
from evidence_to_policy_trace.service import process_evidence_trace
from evidence_to_policy_trace.schemas import EvidenceToPolicyInput, EvidenceToPolicyOutput


class TestEvidenceToPolicyTrace(unittest.TestCase):
    """Test cases for the evidence-to-policy traceability module."""

    def setUp(self):
        """Set up test data before each test."""
        self.basic_input = {
            "request_id": "PA-TEST-001",
            "procedure": "MRI Brain Scan",
            "policy": {
                "policy_id": "POL-001",
                "version": "1.0",
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Clinical indication must be documented",
                        "type": "condition"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Patient reports recurrent headaches.",
                    "document_id": "DOC-001",
                    "document_name": "clinical_notes.pdf",
                    "page": 2,
                    "entity_type": "symptom",
                    "entity_value": "recurrent headaches",
                    "confidence": 0.94
                }
            ]
        }

    def test_input_schema_validation(self):
        """Test that valid input data passes schema validation."""
        # Should not raise an exception
        input_obj = EvidenceToPolicyInput(**self.basic_input)
        self.assertEqual(input_obj.request_id, "PA-TEST-001")
        self.assertEqual(len(input_obj.clinical_evidence), 1)

    def test_output_schema_validation(self):
        """Test that the output conforms to the expected schema."""
        result = process_evidence_trace(self.basic_input)
        # Should not raise an exception
        output_obj = EvidenceToPolicyOutput(**result)
        self.assertEqual(output_obj.request_id, "PA-TEST-001")
        self.assertEqual(output_obj.feature, "evidence_to_policy_trace")
        self.assertEqual(len(output_obj.results), 1)

    def test_matched_requirement(self):
        """Test that a requirement with supporting evidence is marked as matched."""
        result = process_evidence_trace(self.basic_input)

        self.assertEqual(len(result['results']), 1)
        req_result = result['results'][0]

        self.assertEqual(req_result['requirement_id'], "REQ-001")
        self.assertEqual(req_result['status'], "matched")
        self.assertGreater(req_result['confidence'], 0.5)
        self.assertEqual(len(req_result['evidence']), 1)
        self.assertIn("supporting evidence", req_result['explanation'].lower())

    def test_summary_statistics(self):
        """Test that summary statistics are correctly calculated."""
        result = process_evidence_trace(self.basic_input)

        summary = result['summary']
        self.assertEqual(summary['total_requirements'], 1)
        self.assertEqual(summary['matched'], 1)
        self.assertEqual(summary['missing'], 0)
        self.assertEqual(summary['uncertain'], 0)
        self.assertEqual(summary['contradicted'], 0)

    def test_empty_evidence(self):
        """Test behavior when no clinical evidence is provided."""
        input_data = self.basic_input.copy()
        input_data['clinical_evidence'] = []

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        self.assertEqual(req_result['status'], "missing")
        self.assertLess(req_result['confidence'], 0.5)
        self.assertEqual(len(req_result['evidence']), 0)
        self.assertIn("no supporting clinical evidence", req_result['explanation'].lower())

    def test_multiple_requirements(self):
        """Test processing multiple policy requirements."""
        input_data = {
            "request_id": "PA-TEST-002",
            "procedure": "CT Scan",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Requirement one"
                    },
                    {
                        "requirement_id": "REQ-002",
                        "description": "Requirement two"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Evidence for requirement one",
                    "document_id": "DOC-001",
                    "document_name": "doc1.pdf",
                    "confidence": 0.8
                }
            ]
        }

        result = process_evidence_trace(input_data)

        self.assertEqual(len(result['results']), 2)
        self.assertEqual(result['summary']['total_requirements'], 2)

        # First requirement should be matched
        self.assertEqual(result['results'][0]['status'], "matched")
        # Second requirement should be missing
        self.assertEqual(result['results'][1]['status'], "missing")


if __name__ == '__main__':
    unittest.main()