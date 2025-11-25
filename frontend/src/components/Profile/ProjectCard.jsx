import { useNavigate } from "react-router-dom";
import { getTopicChipClass } from "../../constants/topicColors";
// This comment is added to explain the import of the deleteProject function.
// This function is needed to send the delete request to the backend API.
import { deleteProject } from "../../api/projects";


// This comment is added to explain the new onDelete prop.
// The onDelete prop is a function passed from the parent component (ProfilePage)
// to handle the removal of the project from the UI after deletion.
export default function ProjectCard({ project, isOwner = false, onDelete }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (project?.id) {
      const state = { project };
      if (isOwner === true) state.isOwner = true;
      navigate(`/project/${project.id}`, { state });
    }
  };

  // This comment is added to explain the handleDelete function.
  // This function handles the click event of the delete button.
  // It shows a confirmation dialog before proceeding with the deletion.
  // It calls the deleteProject API and then the onDelete callback on success.
  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevents the card's onClick from firing.
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      const success = await deleteProject(project.id);
      if (success) {
        onDelete(project.id); // Notify parent component to update the UI
      } else {
        alert("Failed to delete the project.");
      }
    }
  };

  const tags = Array.isArray(project?.tags) ? project.tags : [];
  const visible = tags.slice(0, 3);
  const extra = Math.max(0, tags.length - 3);

  return (
    <div
      onClick={handleClick}
      className="relative group cursor-pointer w-[292px] h-[273px] rounded-[20px] border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* This comment is added to explain the delete button. */}
      {/* The delete button is only rendered if the user is the owner of the project. */}
      {/* It allows the user to delete their own project directly from their profile page. */}
      {isOwner && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
          aria-label="Delete project"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <div className="relative w-full aspect-[262/94] bg-mGrey overflow-hidden">
        {project?.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            NO IMG
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-grow px-5 pt-4 pb-3">
        <div>
          <h3 className="text-[1.1rem] sm:text-[1.2rem] font-An font-semibold text-black truncate">
            {project?.title || "Project title"}
          </h3>
          <p className="text-[0.875rem] font-IBM text-black truncate">
            {project?.contributor || "Project Contributor"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {visible.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className={`px-3 h-[26px] rounded-[20px] flex items-center justify-center text-[0.875rem] font-IBM ${getTopicChipClass(tag) || "bg-gray-100 text-black"}`}
            >
              {tag}
            </span>
          ))}
          {extra > 0 && (
            <span className="px-3 h-[26px] rounded-[20px] flex items-center justify-center text-[0.875rem] font-IBM bg-gray-100 text-black">
              +{extra}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
