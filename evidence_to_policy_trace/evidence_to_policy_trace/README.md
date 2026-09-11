# Evidence-to-Policy Traceability Module

## Feature Overview
This module provides evidence-to-policy traceability for healthcare prior authorization systems. It compares clinical evidence extracted from patient documents against payer-specific authorization requirements to identify which requirements are supported by evidence, which are missing, and provides traceability back to source documents.

## Problem Solved
Traditional prior authorization workflows require manual examination of clinical documents to verify that submitted evidence meets payer requirements. This creates challenges including:
- Distributed clinical information across multiple documents
- Difficulty locating important evidence
- Missing required documentation
- Inconsistent or contradictory information across documents
- Lack of transparency in AI-generated recommendations
- Increased administrative workload and processing delays

## Solution Implemented
The Evidence-to-Policy Traceability module processes structured clinical evidence and policy requirements to:
1. Match each policy requirement with supporting clinical evidence
2. Identify missing evidence for requirements
3. Calculate requirement-level matching confidence
4. Preserve source document traceability (document name, page, section)
5. Provide human-readable explanations for matching decisions
6. Generate summary statistics for quick assessment

## Architecture
```
evidence_to_policy_trace/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── models.py          # Pydantic models for data structures
│   ├── schemas.py         # Input/output schema definitions
│   ├── service.py         # Main feature logic
│   ├── engine.py          # Matching engine implementation
│   └── utils.py           # Utility functions
├── tests/
│   ├── test_basic.py
│   ├── test_edge_cases.py
│   └── test_integration_contract.py
├── sample_data/
│   ├── sample_policy.json
│   ├── sample_evidence.json
│   └── expected_output.json
├── examples/
│   └── example_usage.py
└── integration/
    └── adapter.py         # Optional integration adapter
```

## Installation
```bash
pip install -r requirements.txt
```

## Dependencies
- Python 3.8+
- Pydantic for data validation
- Standard Python libraries only (no external ML dependencies required)

## Usage
```python
from evidence_to_policy_trace.service import process_evidence_trace

result = process_evidence_trace(input_data)
```

## Usage
```python
from evidence_to_policy_trace.service import process_evidence_trace

result = process_evidence_trace(input_data)
```

## Integration Guide
To integrate this module with an existing prior authorization system:

### 1. Data Preparation
The existing system needs to provide:
- Request ID and procedure information
- Policy requirements in structured format
- Clinical evidence extracted from documents (typically from OCR/NER pipeline)

### 2. Adapter Usage
Use the provided adapter to transform existing system data:

```python
from evidence_to_policy_trace.integration.adapter import adapt_existing_system_input

# Existing system data
request_id = "PA-12345"
procedure = "MRI Brain"
policy_requirements = [...]  # From policy loader
clinical_entities = [...]    # From medical NER
document_metadata = [...]    # From document management

# Transform to module input format
module_input = adapt_existing_system_input(
    request_id=request_id,
    procedure=procedure,
    policy_requirements=policy_requirements,
    clinical_entities=clinical_entities,
    document_metadata=document_metadata
)
```

### 3. Feature Processing
Process the evidence-to-policy traceability:

```python
from evidence_to_policy_trace.service import process_evidence_trace

# Process the data
module_output = process_evidence_trace(module_input)
```

### 4. Output Consumption
The module returns structured results that can be:
- Stored in the database for audit trails
- Displayed in the UI for human reviewers
- Passed to existing XAI/HITL workflows
- Used for automated decision support

Sample output structure:
```json
{
  "request_id": "PA-TEST-001",
  "feature": "evidence_to_policy_trace",
  "results": [
    {
      "requirement_id": "REQ-001",
      "requirement": "Clinical indication must be documented",
      "status": "matched",
      "confidence": 0.94,
      "evidence": [
        {
          "evidence_id": "E-001",
          "text": "Patient reports recurrent headaches.",
          "document_id": "DOC-001",
          "document_name": "clinical_notes.pdf",
          "page": 2
        }
      ],
      "explanation": "Clinical documentation supporting the indication was found."
    }
  ],
  "summary": {
    "total_requirements": 5,
    "matched": 3,
    "missing": 2,
    "uncertain": 0,
    "contradicted": 0
  }
}
```

### 5. Integration Points
The feature can be integrated at various points in the existing PA pipeline:
- After clinical evidence extraction but before final recommendation
- As input to the Human-in-the-Loop review process
- As supplementary information for the Explainable AI module
- For audit logging and compliance tracking