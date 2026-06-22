from app.database.db import SessionLocal
from app.models.notification_model import Notification


# ==========================================
# CREATE NOTIFICATION
# ==========================================
def create_notification(
        user_id,
        role,
        notification_type,
        message,
        request_id=None
):

    db = SessionLocal()

    try:

        notification = Notification(
            user_id=user_id,
            role=role,
            notification_type=notification_type,
            message=message,
            request_id=request_id
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    except Exception as e:

        db.rollback()
        print("Notification Error:", str(e))
        return None

    finally:
        db.close()


# ==========================================
# GET USER NOTIFICATIONS
# ==========================================
def get_notifications(user_id):

    db = SessionLocal()

    try:

        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        return notifications

    finally:
        db.close()


# ==========================================
# MARK AS READ
# ==========================================
def mark_as_read(notification_id):

    db = SessionLocal()

    try:

        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id
            )
            .first()
        )

        if not notification:
            return None

        notification.is_read = True

        db.commit()
        db.refresh(notification)

        return notification

    except Exception as e:

        db.rollback()
        print("Mark Read Error:", str(e))
        return None

    finally:
        db.close()


# ==========================================
# DELETE NOTIFICATION
# ==========================================
def delete_notification(notification_id):

    db = SessionLocal()

    try:

        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id
            )
            .first()
        )

        if not notification:
            return False

        db.delete(notification)
        db.commit()

        return True

    except Exception as e:

        db.rollback()
        print("Delete Notification Error:", str(e))
        return False

    finally:
        db.close()