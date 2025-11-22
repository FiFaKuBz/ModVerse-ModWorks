// Centralized styles for topic/category chips and surfaces.
const TOPIC_COLORS = {
  "UX/UI": { chip: "bg-mPurple text-black", detailBg: "var(--color-mPurple)" },
  "Transportation": { chip: "bg-mBlue text-black", detailBg: "var(--color-mBlue)" },
  "Database": { chip: "bg-mYellow text-black", detailBg: "var(--color-mYellow)" },
  "Algorithm": { chip: "bg-mGreen text-black", detailBg: "var(--color-mGreen)" },
  "Digital Circuit": { chip: "bg-mPink text-black", detailBg: "var(--color-mPink)" },
  "Data Visualization": { chip: "bg-mSalmon text-black", detailBg: "var(--color-mSalmon)" },
};

export const getTopicChipClass = (topic) => TOPIC_COLORS[topic]?.chip;
export const getTopicDetailBg = (topic) => TOPIC_COLORS[topic]?.detailBg;

export default TOPIC_COLORS;
