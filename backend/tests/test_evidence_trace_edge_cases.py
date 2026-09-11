"""
Edge case tests for the Evidence-to-Policy Traceability module.
Adapted from evidence_to_policy_trace/tests/test_edge_cases.py
"""

import unittest
from app.services.evidence_trace.service import process_evidence_trace


class TestEvidenceToPolicyEdgeCases(unittest.TestCase):
    """Test edge cases for the evidence-to-policy traceability module."""

    def test_contradictory_evidence(self):
        """Test handling of contradictory evidence."""
        input_data = {
            "request_id": "PA-TEST-003",
            "procedure": "MRI Brain Scan",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Patient has no history of seizures"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Patient denies any history of seizures or epilepsy.",
                    "document_id": "DOC-001",
                    "document_name": "clinical_notes.pdf",
                    "page": 1,
                    "confidence": 0.9
                },
                {
                    "evidence_id": "E-002",
                    "text": "EEG shows seizure activity consistent with epilepsy.",
                    "document_id": "DOC-002",
                    "document_name": "eeg_results.pdf",
                    "page": 1,
                    "confidence": 0.85
                }
            ]
        }

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        # Should detect contradiction
        self.assertIn(req_result['status'], ["contradicted", "uncertain"])
        self.assertGreater(req_result['confidence'], 0.5)

    def test_low_confidence_evidence(self):
        """Test handling of low-confidence evidence."""
        input_data = {
            "request_id": "PA-TEST-004",
            "procedure": "X-Ray",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Chest pain must be documented"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Patient might have some discomfort in chest area.",
                    "document_id": "DOC-001",
                    "document_name": "notes.pdf",
                    "page": 1,
                    "confidence": 0.3  # Low confidence
                }
            ]
        }

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        # With low confidence evidence, might be uncertain or missing depending on threshold
        self.assertIn(req_result['status'], ["matched", "missing", "uncertain"])
        self.assertGreaterEqual(req_result['confidence'], 0.0)
        self.assertLessEqual(req_result['confidence'], 1.0)

    def test_empty_requirements(self):
        """Test handling of empty policy requirements."""
        input_data = {
            "request_id": "PA-TEST-005",
            "procedure": "Procedure",
            "policy": {
                "requirements": []
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Some evidence",
                    "document_id": "DOC-001",
                    "document_name": "doc.pdf",
                    "confidence": 0.8
                }
            ]
        }

        result = process_evidence_trace(input_data)

        self.assertEqual(result['summary']['total_requirements'], 0)
        self.assertEqual(len(result['results']), 0)

    def test_duplicate_evidence(self):
        """Test handling of duplicate evidence entries."""
        input_data = {
            "request_id": "PA-TEST-006",
            "procedure": "Test",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Symptom documented in clinical notes"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Symptom documented in clinical notes by physician",
                    "document_id": "DOC-001",
                    "document_name": "doc.pdf",
                    "page": 1,
                    "confidence": 0.9
                },
                {
                    "evidence_id": "E-002",
                    "text": "Symptom documented in clinical notes by physician",  # Duplicate text
                    "document_id": "DOC-001",
                    "document_name": "doc.pdf",
                    "page": 1,
                    "confidence": 0.85
                }
            ]
        }

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        # Should handle duplicates appropriately
        self.assertEqual(req_result['status'], "matched")
        self.assertGreaterEqual(len(req_result['evidence']), 1)
        self.assertLessEqual(len(req_result['evidence']), 2)

    def test_irrelevant_documents(self):
        """Test handling of evidence from irrelevant documents."""
        input_data = {
            "request_id": "PA-TEST-007",
            "procedure": "Cardiology Consult",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Cardiac symptoms must be documented"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Patient had a dental cleaning today.",
                    "document_id": "DOC-001",
                    "document_name": "dental_records.pdf",
                    "page": 1,
                    "confidence": 0.9
                }
            ]
        }

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        # Should not match irrelevant evidence
        self.assertEqual(req_result['status'], "missing")
        self.assertEqual(len(req_result['evidence']), 0)

    def test_case_insensitive_matching(self):
        """Test that matching is case insensitive."""
        input_data = {
            "request_id": "PA-TEST-008",
            "procedure": "Test",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "patient has diabetes"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "PATIENT HAS DIABETES MELLITUS TYPE 2",
                    "document_id": "DOC-001",
                    "document_name": "doc.pdf",
                    "page": 1,
                    "confidence": 0.95
                }
            ]
        }

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        # Should match despite case differences
        self.assertEqual(req_result['status'], "matched")
        self.assertGreater(req_result['confidence'], 0.7)

    def test_partial_text_matching(self):
        """Test matching of partial text content."""
        input_data = {
            "request_id": "PA-TEST-009",
            "procedure": "Test",
            "policy": {
                "requirements": [
                    {
                        "requirement_id": "REQ-001",
                        "description": "Patient reports chronic back pain"
                    }
                ]
            },
            "clinical_evidence": [
                {
                    "evidence_id": "E-001",
                    "text": "Patient reports chronic back pain that worsens with activity.",
                    "document_id": "DOC-001",
                    "document_name": "doc.pdf",
                    "page": 1,
                    "confidence": 0.9
                }
            ]
        }

        result = process_evidence_trace(input_data)
        req_result = result['results'][0]

        # Should match partial content
        self.assertEqual(req_result['status'], "matched")
        self.assertGreater(req_result['confidence'], 0.7)


if __name__ == '__main__':
    unittest.main()
