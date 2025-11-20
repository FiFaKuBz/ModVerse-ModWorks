// Centralized styles for topic/category chips and surfaces.
const TOPIC_COLORS = {
  "UX/UI": { chip: "bg-mPurple text-black", detailBg: "mPurple" },
  "Transportation": { chip: "bg-mBlue text-black", detailBg: "mBlue" },
  "Database": { chip: "bg-mYellow text-black", detailBg: "mYellow" },
  "Algorithm": { chip: "bg-mGreen text-black", detailBg: "mGreen" },
  "Digital Circuit": { chip: "bg-mPink text-black", detailBg: "mPink" },
  "Data Visualization": { chip: "bg-mSalmon text-black", detailBg: "mSalmon" },
};

export const getTopicChipClass = (topic) => TOPIC_COLORS[topic]?.chip;
export const getTopicDetailBg = (topic) => TOPIC_COLORS[topic]?.detailBg;

export default TOPIC_COLORS;
