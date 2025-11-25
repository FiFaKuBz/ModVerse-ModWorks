from bson import ObjectId
from datetime import datetime, timezone

class NotificationModel:
    def __init__(self, db):
        self.notifications = db.notifications
        self._create_indexes()

    def _create_indexes(self):
        self.notifications.create_index([("recipient_id", 1), ("created_at", -1)])
        self.notifications.create_index([("is_read", 1)])

    def create_notification(self, recipient_id, sender_id, type, message, project_id=None):
        """
        Create a new notification.
        type: 'like', 'comment', 'follow', 'system'
        """
        if str(recipient_id) == str(sender_id):
            return None  # Don't notify self actions

        notification = {
            "recipient_id": ObjectId(recipient_id),
            "sender_id": ObjectId(sender_id),
            "type": type,
            "message": message,
            "project_id": ObjectId(project_id) if project_id else None,
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = self.notifications.insert_one(notification)
        return result.inserted_id

    def get_user_notifications(self, user_id, limit=20, skip=0):
        """Get notifications for a user, sorted by newest first."""
        cursor = self.notifications.find(
            {"recipient_id": ObjectId(user_id)}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        notifications = list(cursor)
        for n in notifications:
            n["_id"] = str(n["_id"])
            n["recipient_id"] = str(n["recipient_id"])
            n["sender_id"] = str(n["sender_id"])
            if n.get("project_id"):
                n["project_id"] = str(n["project_id"])
            n["created_at"] = n["created_at"].isoformat()
            
        return notifications

    def get_unread_count(self, user_id):
        return self.notifications.count_documents({
            "recipient_id": ObjectId(user_id),
            "is_read": False
        })

    def mark_as_read(self, notification_id, user_id):
        result = self.notifications.update_one(
            {"_id": ObjectId(notification_id), "recipient_id": ObjectId(user_id)},
            {"$set": {"is_read": True}}
        )
        return result.modified_count > 0

    def mark_all_as_read(self, user_id):
        result = self.notifications.update_many(
            {"recipient_id": ObjectId(user_id), "is_read": False},
            {"$set": {"is_read": True}}
        )
        return result.modified_count
