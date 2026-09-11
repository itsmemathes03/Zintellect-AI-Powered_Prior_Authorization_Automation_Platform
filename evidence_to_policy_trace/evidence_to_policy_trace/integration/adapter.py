"""
Integration adapter for the Evidence-to-Policy Traceability module.
Translates data from existing prior authorization system format to the module's input format.
"""

from typing import Dict, Any, List
from evidence_to_policy_trace.schemas import EvidenceToPolicyInput, EvidenceItem, PolicyRequirement


def adapt_existing_system_input(
    request_id: str,
    procedure: str,
    policy_requirements: List[Dict[str, Any]],
    clinical_entities: List[Dict[str, Any]],
    document_metadata: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Adapt data from existing prior authorization system to Evidence-to-Policy Traceability input format.

    Args:
        request_id: Unique identifier for the prior authorization request
        procedure: Medical procedure being authorized
        policy_requirements: List of policy requirements from existing system
        clinical_entities: List of clinical entities extracted from documents
        document_metadata: Optional list of document metadata

    Returns:
        Dictionary matching EvidenceToPolicyInput schema
    """
    # Create a mapping from document IDs to metadata for enrichment
    doc_metadata_map = {}
    if document_metadata:
        for doc in document_metadata:
            doc_id = doc.get('document_id')
            if doc_id:
                doc_metadata_map[doc_id] = doc

    # Transform policy requirements
    adapted_requirements = []
    for i, req in enumerate(policy_requirements):
        adapted_req = {
            'requirement_id': req.get('requirement_id', f'REQ-{i}'),
            'description': req.get('description', req.get('text', '')),
            'type': req.get('type', req.get('category', 'general')),
            'weight': req.get('weight', req.get('importance', 1.0))
        }
        adapted_requirements.append(adapted_req)

    # Transform clinical entities to evidence format
    adapted_evidence = []
    for i, entity in enumerate(clinical_entities):
        # Get document information
        doc_id = entity.get('document_id', f'DOC-{i}')
        doc_meta = doc_metadata_map.get(doc_id, {})

        adapted_evidence_item = {
            'evidence_id': entity.get('evidence_id', entity.get('entity_id', f'E-{i}')),
            'text': entity.get('text', entity.get('entity_text', '')),
            'document_id': doc_id,
            'document_name': doc_meta.get('file_name',
                          entity.get('source_document',
                          entity.get('document_name', f'document_{doc_id}.pdf'))),
            'page': entity.get('page_number', entity.get('page')),
            'section': entity.get('section', entity.get('subsection')),
            'entity_type': entity.get('entity_type', entity.get('type')),
            'entity_value': entity.get('entity_value', entity.get('value', entity.get('normalized_value'))),
            'confidence': entity.get('confidence', entity.get('score', 0.8))
        }
        adapted_evidence.append(adapted_evidence_item)

    # Construct the input matching EvidenceToPolicyInput schema
    input_data = {
        'request_id': request_id,
        'procedure': procedure,
        'policy': {
            'policy_id': f'POL-{request_id}' if request_id else 'POL-ADAPTED',
            'version': '1.0',
            'requirements': adapted_requirements
        },
        'clinical_evidence': adapted_evidence
    }

    return input_data


def adapt_to_existing_system_format(feature_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adapt Evidence-to-Policy Traceability output to existing system format.
    This is useful if the existing system expects a different output format.

    Args:
        feature_output: Output from the evidence_to_policy_trace module

    Returns:
        Dictionary in existing system format
    """
    # This adaptation depends on what the existing system expects
    # For now, we'll return a enhanced version that adds traceability information

    adapted_output = {
        'request_id': feature_output.get('request_id'),
        'feature_used': feature_output.get('feature'),
        'traceability_results': [],
        'summary': feature_output.get('summary'),
        'processing_metadata': {
            'total_requirements_processed': feature_output.get('summary', {}).get('total_requirements', 0),
            'evidence_items_considered': sum(
                len(req_result.get('evidence', []))
                for req_result in feature_output.get('results', [])
            )
        }
    }

    # Transform each requirement result
    for req_result in feature_output.get('results', []):
        adapted_req_result = {
            'requirement_id': req_result.get('requirement_id'),
            'requirement_text': req_result.get('requirement'),
            'status': req_result.get('status'),
            'confidence_score': req_result.get('confidence'),
            'supporting_evidence': [],
            'explanation': req_result.get('explanation')
        }

        # Transform evidence
        for evidence in req_result.get('evidence', []):
            adapted_evidence = {
                'evidence_id': evidence.get('evidence_id'),
                'text': evidence.get('text'),
                'source_document': evidence.get('document_name'),
                'source_document_id': evidence.get('document_id'),
                'page_number': evidence.get('page'),
                'section': evidence.get('section'),
                'confidence': evidence.get('confidence')
            }
            adapted_req_result['supporting_evidence'].append(adapted_evidence)

        adapted_output['traceability_results'].append(adapted_req_result)

    return adapted_output


# Example usage function
def example_adapter_usage():
    """Example showing how to use the adapter with existing system data."""

    # Simulated existing system data
    existing_request_id = "PA-EXT-SYS-001"
    existing_procedure = "Brain MRI with Contrast"

    existing_policy_requirements = [
        {
            'requirement_id': 'EXT-REQ-001',
            'description': 'Documented clinical indication for neurological imaging',
            'type': 'indication',
            'weight': 1.0
        },
        {
            'requirement_id': 'EXT-REQ-002',
            'description': 'Evidence of failed conservative management',
            'type': 'treatment_history',
            'weight': 0.9
        }
    ]

    existing_clinical_entities = [
        {
            'evidence_id': 'EXT-E-001',
            'entity_text': 'Patient presents with chronic migraine headaches unresponsive to standard therapy',
            'document_id': 'EXT-DOC-001',
            'source_document': 'neurology_consult.pdf',
            'page_number': 3,
            'entity_type': 'symptom',
            'entity_value': 'chronic migraine',
            'confidence': 0.92
        },
        {
            'entity_text': 'Patient has tried NSAIDs, triptans, and lifestyle modifications with inadequate relief',
            'document_id': 'EXT-DOC-001',
            'source_document': 'treatment_history.pdf',
            'page_number': 1,
            'entity_type': 'treatment',
            'entity_value': 'failed conservative therapy',
            'confidence': 0.88
        }
    ]

    existing_document_metadata = [
        {
            'document_id': 'EXT-DOC-001',
            'file_name': 'neurology_consult.pdf',
            'upload_date': '2024-01-15',
            'document_type': 'clinical_note'
        },
        {
            'document_id': 'EXT-DOC-002',
            'file_name': 'treatment_history.pdf',
            'upload_date': '2024-01-14',
            'document_type': 'treatment_record'
        }
    ]

    # Adapt to module input format
    module_input = adapt_existing_system_input(
        request_id=existing_request_id,
        procedure=existing_procedure,
        policy_requirements=existing_policy_requirements,
        clinical_entities=existing_clinical_entities,
        document_metadata=existing_document_metadata
    )

    # Process with the module (would normally call process_evidence_trace here)
    # module_output = process_evidence_trace(module_input)

    # Adapt back to existing system format (if needed)
    # adapted_output = adapt_to_existing_system_format(module_output)

    return module_input


if __name__ == "__main__":
    # Run example when script is executed directly
    example_input = example_adapter_usage()
    print("Adapter example input:")
    print(f"Request ID: {example_input['request_id']}")
    print(f"Procedure: {example_input['procedure']}")
    print(f"Number of requirements: {len(example_input['policy']['requirements'])}")
    print(f"Number of evidence items: {len(example_input['clinical_evidence'])}")