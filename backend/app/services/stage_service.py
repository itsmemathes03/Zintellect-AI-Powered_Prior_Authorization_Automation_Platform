from datetime import datetime

from app.database.db import SessionLocal
from app.models.authorization_stage_model import (
    AuthorizationStage
)


def create_stage(
        request_id,
        stage_name,
        status="Pending",
        progress=0,
        message=None
):

    db = SessionLocal()

    try:

        stage = AuthorizationStage(
            request_id=request_id,
            stage_name=stage_name,
            status=status,
            progress=progress,
            message=message
        )

        db.add(stage)
        db.commit()
        db.refresh(stage)

        return stage

    finally:
        db.close()


def update_stage(
        request_id,
        stage_name,
        status=None,
        progress=None,
        message=None
):

    db = SessionLocal()

    try:

        stage = db.query(
            AuthorizationStage
        ).filter(
            AuthorizationStage.request_id == request_id,
            AuthorizationStage.stage_name == stage_name
        ).first()

        if not stage:
            return None

        if status:
            stage.status = status

        if progress is not None:
            stage.progress = progress

        if message:
            stage.message = message

        db.commit()
        db.refresh(stage)

        return stage

    finally:
        db.close()


def complete_stage(
        request_id,
        stage_name,
        message=None
):

    db = SessionLocal()

    try:

        stage = db.query(
            AuthorizationStage
        ).filter(
            AuthorizationStage.request_id == request_id,
            AuthorizationStage.stage_name == stage_name
        ).first()

        if not stage:
            return None

        stage.status = "Completed"
        stage.progress = 100
        stage.completed_at = datetime.utcnow()

        if message:
            stage.message = message

        db.commit()
        db.refresh(stage)

        return stage

    finally:
        db.close()


def get_stage_history(request_id):

    db = SessionLocal()

    try:

        stages = db.query(
            AuthorizationStage
        ).filter(
            AuthorizationStage.request_id == request_id
        ).all()

        return stages

    finally:
        db.close()