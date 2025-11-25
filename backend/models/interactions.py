# backend/models/interactions.py
from bson import ObjectId
from datetime import datetime, timezone

class InteractionModel:
    def __init__(self, db):
        self.db = db
        self.users = db.users
        self.projects = db.projects

    def get_user_interactions(self, user_id: ObjectId, project_id: ObjectId):
        """
        Checks a user's interaction status (liked, disliked, saved) for a specific project.

        :param user_id: The user's ObjectId.
        :param project_id: The project's ObjectId.
        :return: A dictionary with boolean flags for 'isLiked', 'isDisliked', and 'isSaved'.
        """
        if not user_id:
            return {"isLiked": False, "isDisliked": False, "isSaved": False}

        user = self.users.find_one(
            {"_id": user_id},
            {"liked_projects": 1, "disliked_projects": 1, "saved_projects": 1}
        )
        
        project_id_str = str(project_id)

        return {
            "isLiked": project_id_str in user.get("liked_projects", []),
            "isDisliked": project_id_str in user.get("disliked_projects", []),
            "isSaved": project_id_str in user.get("saved_projects", []),
        }

    def toggle_like(self, user_id: ObjectId, project_id: ObjectId):
        """
        Toggles a user's 'like' on a project.
        If the user dislikes the project, the dislike is removed.
        Updates the project's like count.

        :param user_id: The user's ObjectId.
        :param project_id: The project's ObjectId.
        :return: A dictionary with the updated interaction status.
        """
        project_id_str = str(project_id)
        
        # Check if user already liked this project
        user_liked = self.users.find_one({"_id": user_id, "liked_projects": project_id_str})

        if user_liked:
            # --- Unlike the project ---
            self.users.update_one(
                {"_id": user_id},
                {"$pull": {"liked_projects": project_id_str}}
            )
            self.projects.update_one(
                {"_id": project_id},
                {"$inc": {"metrics.likes": -1}}
            )
        else:
            # --- Like the project ---
            # Add to user's liked list and remove from disliked list
            self.users.update_one(
                {"_id": user_id},
                {
                    "$addToSet": {"liked_projects": project_id_str},
                    "$pull": {"disliked_projects": project_id_str}
                }
            )
            # Update project's like count
            self.projects.update_one(
                {"_id": project_id},
                {"$inc": {"metrics.likes": 1}}
            )
            
        return self.get_user_interactions(user_id, project_id)

    def toggle_dislike(self, user_id: ObjectId, project_id: ObjectId):
        """
        Toggles a user's 'dislike' on a project.
        If the user likes the project, the like is removed.
        
        :param user_id: The user's ObjectId.
        :param project_id: The project's ObjectId.
        :return: A dictionary with the updated interaction status.
        """
        project_id_str = str(project_id)
        
        # Check if user already disliked this project
        user_disliked = self.users.find_one({"_id": user_id, "disliked_projects": project_id_str})
        
        # Check if the user previously liked it to adjust the like count
        was_liked = self.users.find_one({"_id": user_id, "liked_projects": project_id_str})

        if user_disliked:
            # --- Undislike the project ---
            self.users.update_one(
                {"_id": user_id},
                {"$pull": {"disliked_projects": project_id_str}}
            )
        else:
            # --- Dislike the project ---
            update_ops = {
                "$addToSet": {"disliked_projects": project_id_str},
                "$pull": {"liked_projects": project_id_str}
            }
            self.users.update_one({"_id": user_id}, update_ops)
            
            # If it was previously liked, decrement the project's like count
            if was_liked:
                self.projects.update_one(
                    {"_id": project_id},
                    {"$inc": {"metrics.likes": -1}}
                )

        return self.get_user_interactions(user_id, project_id)

    def toggle_save(self, user_id: ObjectId, project_id: ObjectId):
        """
        Toggles a user's 'save' (bookmark) on a project.

        :param user_id: The user's ObjectId.
        :param project_id: The project's ObjectId.
        :return: A dictionary with the updated interaction status.
        """
        project_id_str = str(project_id)
        user = self.users.find_one({"_id": user_id})
        saved_projects = user.get("saved_projects", [])

        if project_id_str in saved_projects:
            # --- Unsave the project ---
            self.users.update_one(
                {"_id": user_id},
                {"$pull": {"saved_projects": project_id_str}}
            )
        else:
            # --- Save the project ---
            self.users.update_one(
                {"_id": user_id},
                {"$addToSet": {"saved_projects": project_id_str}}
            )
        
        return self.get_user_interactions(user_id, project_id)
