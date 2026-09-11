"""
Provider Communicator Core Logic
"""
import logging
from typing import List, Dict, Any, Optional
from .models import CommunicationChannel, CommunicationStatus, TemplateType, CommunicationRecord, CommunicationRequest, CommunicationTemplate
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class ProviderCommunicator:
    """
    Core logic for generating and sending communications to providers.
    This is a simplified implementation that uses templates and simulates sending via different channels.
    In a real implementation, this would integrate with actual communication services (email, fax, portal, SMS).
    """

    def __init__(self):
        # We'll maintain a simple in-memory template store.
        # In a real system, this might be loaded from a database or a template service.
        self.templates: Dict[str, CommunicationTemplate] = {}
        self._initialize_templates()

    def _initialize_templates(self):
        """
        Initialize a set of default templates for demonstration.
        """
        # Quality Issue Template
        quality_issue_template = CommunicationTemplate(
            template_id="temp_quality_issue_001",
            template_type=TemplateType.QUALITY_ISSUE,
            subject="Document Quality Issue Detected for Request {request_id}",
            body="""Dear Provider,

We have identified a quality issue with the document submitted for prior authorization request {request_id}.

Issue Details:
{document_quality_issues}

Recommended Action:
{recommended_action}

Please review and resubmit a clear, legible document if necessary.

Thank you for your attention to this matter.

Sincerely,
Prior Authorization Team""",
            channels=[CommunicationChannel.PORTAL, CommunicationChannel.EMAIL, CommunicationChannel.FAX],
            variables=["request_id", "document_quality_issues", "recommended_action"]
        )

        # Missing Information Template
        missing_info_template = CommunicationTemplate(
            template_id="temp_missing_info_001",
            template_type=TemplateType.MISSING_INFORMATION,
            subject="Missing Information Required for Request {request_id}",
            body="""Dear Provider,

We are unable to process prior authorization request {request_id} due to missing information.

Missing Information:
{missing_information}

Please provide the missing information to continue the review process.

Thank you for your cooperation.

Sincerely,
Prior Authorization Team""",
            channels=[CommunicationChannel.PORTAL, CommunicationChannel.EMAIL, CommunicationChannel.FAX],
            variables=["request_id", "missing_information"]
        )

        # Approval Template
        approval_template = CommunicationTemplate(
            template_id="temp_approval_001",
            template_type=TemplateType.APPROVAL,
            subject="Prior Authorization Approved for Request {request_id}",
            body="""Dear Provider,

We are pleased to inform you that the prior authorization request {request_id} has been approved.

Approval Details:
{approval_details}

The authorization is valid until {valid_until}.

Please proceed with the service as per the approved terms.

Thank you.

Sincerely,
Prior Authorization Team""",
            channels=[CommunicationChannel.PORTAL, CommunicationChannel.EMAIL, CommunicationChannel.FAX],
            variables=["request_id", "approval_details", "valid_until"]
        )

        # Denial Template
        denial_template = CommunicationTemplate(
            template_id="temp_denial_001",
            template_type=TemplateType.DENIAL,
            subject="Prior Authorization Denied for Request {request_id}",
            body="""Dear Provider,

After careful review, we must inform you that the prior authorization request {request_id} has been denied.

Denial Reason:
{denial_reason}

You may appeal this decision by following the appeal process outlined in our provider manual.

Thank you for your understanding.

Sincerely,
Prior Authorization Team""",
            channels=[CommunicationChannel.PORTAL, CommunicationChannel.EMAIL, CommunicationChannel.FAX],
            variables=["request_id", "denial_reason"]
        )

        # Status Update Template
        status_update_template = CommunicationTemplate(
            template_id="temp_status_update_001",
            template_type=TemplateType.STATUS_UPDATE,
            subject="Status Update for Request {request_id}",
            body="""Dear Provider,

Here is the latest status update for prior authorization request {request_id}.

Current Status:
{current_status}

Next Steps:
{next_steps}

Expected Completion Date:
{expected_completion_date}

Please let us know if you have any questions.

Thank you.

Sincerely,
Prior Authorization Team""",
            channels=[CommunicationChannel.PORTAL, CommunicationChannel.EMAIL, CommunicationChannel.FAX],
            variables=["request_id", "current_status", "next_steps", "expected_completion_date"]
        )

        # Request for Clarification Template
        clarification_template = CommunicationTemplate(
            template_id="temp_clarification_001",
            template_type=TemplateType.REQUEST_FOR_CLARIFICATION,
            subject="Clarification Needed for Request {request_id}",
            body="""Dear Provider,

We require additional clarification to process prior authorization request {request_id}.

Clarification Needed:
{clarification_needed}

Please provide the requested information at your earliest convenience.

Thank you for your prompt attention to this matter.

Sincerely,
Prior Authorization Team""",
            channels=[CommunicationChannel.PORTAL, CommunicationChannel.EMAIL, CommunicationChannel.FAX],
            variables=["request_id", "clarification_needed"]
        )

        # Store the templates
        self.templates[quality_issue_template.template_id] = quality_issue_template
        self.templates[missing_info_template.template_id] = missing_info_template
        self.templates[approval_template.template_id] = approval_template
        self.templates[denial_template.template_id] = denial_template
        self.templates[status_update_template.template_id] = status_update_template
        self.templates[clarification_template.template_id] = clarification_template

        logger.info(f"Initialized {len(self.templates)} communication templates")

    def get_template(self, template_id: str) -> Optional[CommunicationTemplate]:
        """
        Retrieve a template by its ID.

        Args:
            template_id: The ID of the template.

        Returns:
            The CommunicationTemplate if found, otherwise None.
        """
        return self.templates.get(template_id)

    def get_template_by_type_and_channel(self, template_type: TemplateType, channel: CommunicationChannel) -> Optional[CommunicationTemplate]:
        """
        Retrieve a template that matches the given type and supports the given channel.
        If multiple templates match, we return the first one (or we could have a more sophisticated selection).
        """
        for template in self.templates.values():
            if template.template_type == template_type and channel in template.channels:
                return template
        return None

    def generate_communication(self, request: CommunicationRequest) -> CommunicationRecord:
        """
        Generate a communication record based on the request.
        This does not actually send the communication; it prepares the record.

        Args:
            request: The communication request.

        Returns:
            A CommunicationRecord representing the communication to be sent.
        """
        logger.info(f"Generating communication for request {request.request_id} using template type {request.template_type.value} and channel {request.channel.value}")

        # Determine which template to use
        template: Optional[CommunicationTemplate] = None
        if request.template_id:
            template = self.get_template(request.template_id)
            if not template:
                logger.warning(f"Template {request.template_id} not found, falling back to type and channel based selection")
        if not template:
            template = self.get_template_by_type_and_channel(request.template_type, request.channel)
            if not template:
                # If no template is found, we'll create a generic one (or raise an error)
                logger.error(f"No template found for type {request.template_type} and channel {request.channel}")
                # For the sake of this example, we'll create a minimal template on the fly.
                # In a real system, we might have a default template or raise an exception.
                template = CommunicationTemplate(
                    template_id=f"temp_generated_{uuid.uuid4()}",
                    template_type=request.template_type,
                    subject=f"Communication Regarding Request {request.request_id}",
                    body="Please see the context for details.",
                    channels=[request.channel],
                    variables=list(request.context.keys())
                )

        # Generate a unique ID for this communication
        communication_id = str(uuid.uuid4())

        # Render the template with the context
        subject = template.subject
        body = template.body
        for var in template.variables:
            placeholder = "{" + var + "}"
            value = request.context.get(var, f"[{var}_not_provided]")
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))

        # Create the communication record
        record = CommunicationRecord(
            communication_id=communication_id,
            request_id=request.request_id,
            provider_id=request.provider_id,
            template_used=template.template_id,
            channel=request.channel,
            status=CommunicationStatus.PENDING,  # We'll set to sent when we actually send it
            subject=subject,
            body=body,
            sent_at=None,
            delivered_at=None,
            read_at=None,
            metadata={}
        )

        logger.info(f"Generated communication {communication_id} for request {request.request_id}")
        return record

    def send_communication(self, record: CommunicationRecord) -> CommunicationRecord:
        """
        Send the communication via the specified channel.
        This is a simulated send; in a real system, we would integrate with actual services.

        Args:
            record: The communication record to send.

        Returns:
            The updated communication record with status and timestamps.
        """
        logger.info(f"Sending communication {record.communication_id} via channel {record.channel.value}")

        # Simulate sending via the channel
        # In a real system, we would call the appropriate service (email, fax, portal, SMS) here.
        # For now, we'll just mark it as sent and set the sent_at timestamp.

        # We'll simulate a small chance of failure for demonstration.
        import random
        if random.random() < 0.05:  # 5% chance of failure
            record.status = CommunicationStatus.FAILED
            logger.warning(f"Communication {record.communication_id} failed to send")
        else:
            record.status = CommunicationStatus.SENT
            record.sent_at = datetime.now()
            logger.info(f"Communication {record.communication_id} sent successfully")

        # In a real system, we might also update the status based on delivery receipts (e.g., for email, we might get a delivery notification later).
        # For simplicity, we'll assume that if sent, it is also delivered immediately (or we could have a separate process for delivery updates).
        if record.status == CommunicationStatus.SENT:
            record.status = CommunicationStatus.DELIVERED
            record.delivered_at = datetime.now()
            logger.info(f"Communication {record.communication_id} delivered")

        return record


# Factory function
def create_provider_communicator() -> ProviderCommunicator:
    return ProviderCommunicator()