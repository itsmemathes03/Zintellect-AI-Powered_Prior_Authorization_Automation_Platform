"""
Example usage of the Evidence-to-Policy Traceability module.
"""

import json
from evidence_to_policy_trace.service import process_evidence_trace


def main():
    """Demonstrate usage of the evidence-to-policy traceability module."""

    # Sample input data
    input_data = {
        "request_id": "PA-TEST-001",
        "procedure": "MRI Brain Scan",
        "policy": {
            "policy_id": "POL-001",
            "version": "1.0",
            "requirements": [
                {
                    "requirement_id": "REQ-001",
                    "description": "Clinical indication must be documented",
                    "type": "condition",
                    "weight": 1.0
                },
                {
                    "requirement_id": "REQ-002",
                    "description": "Neurological symptoms must be documented",
                    "type": "condition",
                    "weight": 1.0
                },
                {
                    "requirement_id": "REQ-003",
                    "description": "Failed conservative treatment must be documented",
                    "type": "treatment",
                    "weight": 0.8
                },
                {
                    "requirement_id": "REQ-004",
                    "description": "No contraindications to MRI must be documented",
                    "type": "contraindication",
                    "weight": 0.9
                }
            ]
        },
        "clinical_evidence": [
            {
                "evidence_id": "E-001",
                "text": "Patient presents with recurrent headaches and neurological symptoms including blurred vision and dizziness.",
                "document_id": "DOC-001",
                "document_name": "clinical_notes.pdf",
                "page": 2,
                "entity_type": "symptom",
                "entity_value": "headaches",
                "confidence": 0.94
            },
            {
                "evidence_id": "E-002",
                "text": "Patient reports experiencing headaches for the past 3 months, occurring 2-3 times per week.",
                "document_id": "DOC-001",
                "document_name": "clinical_notes.pdf",
                "page": 2,
                "entity_type": "symptom",
                "entity_value": "headaches",
                "confidence": 0.91
            },
            {
                "evidence_id": "E-003",
                "text": "Neurological examination shows mild cranial nerve deficits but no signs of increased intracranial pressure.",
                "document_id": "DOC-001",
                "document_name": "clinical_notes.pdf",
                "page": 3,
                "entity_type": "examination",
                "entity_value": "neurological exam",
                "confidence": 0.88
            },
            {
                "evidence_id": "E-004",
                "text": "Patient has tried over-the-counter pain medications and rest with minimal improvement.",
                "document_id": "DOC-002",
                "document_name": "treatment_notes.pdf",
                "page": 1,
                "entity_type": "treatment",
                "entity_value": "conservative treatment",
                "confidence": 0.85
            },
            {
                "evidence_id": "E-005",
                "text": "No known allergies to contrast media or history of claustrophobia reported.",
                "document_id": "DOC-002",
                "document_name": "treatment_notes.pdf",
                "page": 1,
                "entity_type": "history",
                "entity_value": "contraindication check",
                "confidence": 0.90
            }
        ]
    }

    # Process the evidence-to-policy traceability
    print("Processing evidence-to-policy traceability...")
    result = process_evidence_trace(input_data)

    # Display results
    print("\n=== EVIDENCE-TO-POLICY TRACEABILITY RESULTS ===")
    print(f"Request ID: {result['request_id']}")
    print(f"Feature: {result['feature']}")
    print(f"Total Requirements: {result['summary']['total_requirements']}")
    print(f"Matched: {result['summary']['matched']}")
    print(f"Missing: {result['summary']['missing']}")
    print(f"Uncertain: {result['summary']['uncertain']}")
    print(f"Contradicted: {result['summary']['contradicted']}")

    print("\n--- DETAILED RESULTS ---")
    for i, req_result in enumerate(result['results'], 1):
        print(f"\n{i}. Requirement: {req_result['requirement']}")
        print(f"   Status: {req_result['status']}")
        print(f"   Confidence: {req_result['confidence']:.2f}")
        print(f"   Evidence Count: {len(req_result['evidence'])}")
        print(f"   Explanation: {req_result['explanation']}")

        if req_result['evidence']:
            print("   Supporting Evidence:")
            for j, evidence in enumerate(req_result['evidence'], 1):
                print(f"     {j}. [{evidence['evidence_id']}] {evidence['text']}")
                print(f"        Document: {evidence['document_name']}, Page: {evidence['page']}")
                print(f"        Confidence: {evidence['confidence']:.2f}")

    # Save results to file for inspection
    with open('traceability_result.json', 'w') as f:
        json.dump(result, f, indent=2)
    print("\nResults saved to 'traceability_result.json'")


if __name__ == "__main__":
    main()