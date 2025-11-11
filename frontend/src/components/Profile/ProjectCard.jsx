import { useNavigate } from "react-router-dom";

const tagColors = {
  "UX/UI": "bg-mPurple text-black",
  "Transportation": "bg-mBlue text-black",
  "Database": "bg-mYellow text-black",
  "Algorithm": "bg-mGreen text-black",
  "Digital Circuit": "bg-mPink text-black",
};

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  // Click handler (navigate to project details later)
  const handleClick = () => {
    // Navigate to detail and pass the project as state for quick render
    if (project?.id) {
      navigate(`/project/${project.id}`, { state: { project } });
    }
  };

  return (
    <div
      onClick={handleClick}
      className="
        relative
        group
        cursor-pointer
        w-[292px]
        h-[273px]
        rounded-[20px]
        border
        border-gray-200
        bg-white
        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1
        transition-all
        duration-200
        flex
        flex-col
        overflow-hidden
      "
    >
      {/* Image */}
      <div className="relative w-full aspect-[262/94] bg-mGrey overflow-hidden">
        {project.image ? (
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

      {/* Content */}
      <div className="flex flex-col justify-between flex-grow px-5 pt-4 pb-3">
        {/* Text */}
        <div>
          <h3 className="text-[1.1rem] sm:text-[1.2rem] font-An font-semibold text-black truncate">
            {project.title || "Project title"}
          </h3>
          <p className="text-[0.875rem] font-IBM text-black truncate">
            {project.contributor || "Project Contributor"}
          </p>
        </div>

        {/* Tags (bottom left) */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(() => {
            const tags = project.tags || [];
            const visible = tags.slice(0, 3);
            const extra = Math.max(0, tags.length - 3);
            return (
              <>
                {visible.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-3 h-[26px] rounded-[20px] flex items-center justify-center text-[0.875rem] font-IBM ${tagColors[tag] || "bg-gray-100 text-black"}`}
                  >
                    {tag}
                  </span>
                ))}
                {extra > 0 && (
                  <span className="px-3 h-[26px] rounded-[20px] flex items-center justify-center text-[0.875rem] font-IBM bg-gray-100 text-black">+{extra}</span>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
