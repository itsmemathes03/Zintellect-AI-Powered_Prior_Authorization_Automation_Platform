"""
Prioritizer Core Logic
"""
import logging
from typing import List, Dict, Any, Optional
from .models import PrioritizationInput, PrioritizationResult, RiskAssessment, PriorityLevel, RiskFactor
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RequestPrioritizer:
    """
    Core logic for prioritizing PA requests.
    This is a simplified implementation that uses heuristics to assign risk scores and priority levels.
    """

    def __init__(self):
        # Weights for different risk factors (these could be configurable)
        self.weights = {
            RiskFactor.PROCEDURE_COMPLEXITY: 0.3,
            RiskFactor.PATIENT_HISTORY: 0.2,
            RiskFactor.PROVIDER_HISTORY: 0.2,
            RiskFactor.TIME_SENSITIVITY: 0.2,
            RiskFactor.RESOURCE_AVAILABILITY: 0.1
        }

    def prioritize_request(self, input_data: PrioritizationInput) -> PrioritizationResult:
        """
        Prioritize a PA request based on the input data.

        Args:
            input_data: The input data for the request.

        Returns:
            A PrioritizationResult containing the priority level, score, and risk assessments.
        """
        logger.info(f"Prioritizing request {input_data.request_id}")

        # We'll compute a risk score for each risk factor
        risk_assessments: List[RiskAssessment] = []

        # 1. Procedure Complexity
        proc_complexity_score = self._assess_procedure_complexity(input_data.procedure_code, input_data.procedure_name)
        risk_assessments.append(RiskAssessment(
            risk_factor=RiskFactor.PROCEDURE_COMPLEXITY,
            score=proc_complexity_score,
            description="Based on the procedure code and name, assessing the complexity and risk associated with the procedure.",
            contributing_factors=[f"Procedure: {input_data.procedure_name} ({input_data.procedure_code})"]
        ))

        # 2. Patient History
        patient_history_score = self._assess_patient_history(input_data.patient_id, input_data.clinical_information)
        risk_assessments.append(RiskAssessment(
            risk_factor=RiskFactor.PATIENT_HISTORY,
            score=patient_history_score,
            description="Based on the patient's historical data and current clinical information.",
            contributing_factors=["Patient history analysis"]
        ))

        # 3. Provider History
        provider_history_score = self._assess_provider_history(input_data.provider_id)
        risk_assessments.append(RiskAssessment(
            risk_factor=RiskFactor.PROVIDER_HISTORY,
            score=provider_history_score,
            description="Based on the provider's historical data (e.g., past approval rates, adherence to guidelines).",
            contributing_factors=["Provider history analysis"]
        ))

        # 4. Time Sensitivity
        time_sensitivity_score = self._assess_time_sensitivity(input_data.requested_service_date, input_data.urgency_indication)
        risk_assessments.append(RiskAssessment(
            risk_factor=RiskFactor.TIME_SENSITIVITY,
            score=time_sensitivity_score,
            description="Based on how time-sensitive the request is (e.g., urgent procedure, impending deadline).",
            contributing_factors=[f"Urgency indication: {input_data.urgency_indication or 'None'}"]
        ))

        # 5. Resource Availability
        resource_availability_score = self._assess_resource_availability(input_data.insurance_info)
        risk_assessments.append(RiskAssessment(
            risk_factor=RiskFactor.RESOURCE_AVAILABILITY,
            score=resource_availability_score,
            description="Based on the availability of resources (e.g., facility, specialist, equipment) for the procedure.",
            contributing_factors=["Resource availability analysis"]
        ))

        # Calculate the weighted risk score (which we'll use as the priority score, higher risk -> higher priority)
        priority_score = 0.0
        for assessment in risk_assessments:
            weight = self.weights.get(assessment.risk_factor, 0.0)
            priority_score += assessment.score * weight

        # Normalize the priority score to be between 0 and 1 (though our calculation should already be in that range if scores are 0-1 and weights sum to 1)
        # We'll clamp it just in case.
        priority_score = max(0.0, min(1.0, priority_score))

        # Determine the priority level based on the score
        priority_level = self._score_to_priority_level(priority_score)

        # Generate a recommended action based on the priority level and risk assessments
        recommended_action = self._generate_recommended_action(priority_level, risk_assessments)

        # Estimate processing time and SLA deadline (simplified)
        estimated_processing_time = self._estimate_processing_time(priority_level)
        sla_deadline = None
        if estimated_processing_time is not None:
            # Assuming we want to set a deadline from now
            sla_deadline = datetime.now() + timedelta(hours=estimated_processing_time)

        result = PrioritizationResult(
            request_id=input_data.request_id,
            priority_level=priority_level,
            priority_score=priority_score,
            risk_assessments=risk_assessments,
            recommended_action=recommended_action,
            estimated_processing_time=estimated_processing_time,
            sla_deadline=sla_deadline,
            assessment_timestamp=datetime.now()
        )

        logger.info(f"Prioritized request {input_data.request_id} as {priority_level.value} with score {priority_score:.2f}")
        return result

    def _assess_procedure_complexity(self, procedure_code: str, procedure_name: str) -> float:
        """
        Assess the complexity of the procedure based on code and name.
        This is a placeholder implementation.
        """
        # In a real system, we might look up the procedure in a database or use a model.
        # For now, we'll return a fixed value for demonstration.
        # We can make it vary based on the code or name.
        if "surgery" in procedure_name.lower() or "operation" in procedure_name.lower():
            return 0.9
        elif "injection" in procedure_name.lower() or "infusion" in procedure_name.lower():
            return 0.6
        else:
            return 0.5

    def _assess_patient_history(self, patient_id: str, clinical_information: Optional[str]) -> float:
        """
        Assess risk based on patient history.
        This is a placeholder implementation.
        """
        # We might look up the patient's history in a database.
        # For now, we'll return a fixed value.
        if clinical_information and ("chronic" in clinical_information.lower() or "severe" in clinical_information.lower()):
            return 0.8
        return 0.4

    def _assess_provider_history(self, provider_id: str) -> float:
        """
        Assess risk based on provider history.
        This is a placeholder implementation.
        """
        # We might look up the provider's history in a database.
        # For now, we'll return a fixed value.
        return 0.3

    def _assess_time_sensitivity(self, requested_service_date: Optional[datetime], urgency_indication: Optional[str]) -> float:
        """
        Assess time sensitivity of the request.
        This is a placeholder implementation.
        """
        score = 0.0
        if urgency_indication and urgency_indication.lower() in ["urgent", "emergency", "stat"]:
            score += 0.5
        if requested_service_date:
            # If the requested date is soon, increase the score.
            # For example, if within 24 hours, add 0.5; within 72 hours, add 0.3.
            # We'll do a simple calculation.
            hours_until = (requested_service_date - datetime.now()).total_seconds() / 3600
            if hours_until < 24:
                score += 0.5
            elif hours_until < 72:
                score += 0.3
            elif hours_until < 168:  # within a week
                score += 0.1
        return min(1.0, score)  # Cap at 1.0

    def _assess_resource_availability(self, insurance_info: Optional[Dict[str, Any]]) -> float:
        """
        Assess resource availability based on insurance info.
        This is a placeholder implementation.
        """
        # We might check if the procedure is covered, if prior auth is typically required, etc.
        # For now, we'll return a fixed value.
        return 0.5

    def _score_to_priority_level(self, score: float) -> PriorityLevel:
        """
        Convert a priority score to a priority level.
        """
        if score >= 0.8:
            return PriorityLevel.URGENT
        elif score >= 0.6:
            return PriorityLevel.HIGH
        elif score >= 0.4:
            return PriorityLevel.MEDIUM
        else:
            return PriorityLevel.LOW

    def _generate_recommended_action(self, priority_level: PriorityLevel, risk_assessments: List[RiskAssessment]) -> str:
        """
        Generate a recommended action based on the priority level and risk assessments.
        """
        if priority_level == PriorityLevel.URGENT:
            return "Expedite review and consider immediate approval if clinically appropriate."
        elif priority_level == PriorityLevel.HIGH:
            return "Prioritize for review within the next business day."
        elif priority_level == PriorityLevel.MEDIUM:
            return "Process in the standard workflow."
        else:
            return "Low priority, can be processed in batch during low-volume periods."

    def _estimate_processing_time(self, priority_level: PriorityLevel) -> Optional[int]:
        """
        Estimate the processing time in hours based on priority level.
        These are example values.
        """
        if priority_level == PriorityLevel.URGENT:
            return 4  # 4 hours
        elif priority_level == PriorityLevel.HIGH:
            return 24  # 1 day
        elif priority_level == PriorityLevel.MEDIUM:
            return 72  # 3 days
        else:
            return 168  # 1 week


# Factory function
def create_request_prioritizer() -> RequestPrioritizer:
    return RequestPrioritizer()