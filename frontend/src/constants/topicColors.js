// Centralized styles for topic/category chips and surfaces.
const TOPIC_COLORS = {
  "UX/UI": { chip: "bg-mPurple text-black", detailBg: "#D3C2CD" },
  Transportation: { chip: "bg-mBlue text-black", detailBg: "#92A2A6" },
  Database: { chip: "bg-mYellow text-black", detailBg: "#EFCE7B" },
  Algorithm: { chip: "bg-mGreen text-black", detailBg: "#CBD183" },
  "Digital Circuit": { chip: "bg-mPink text-black", detailBg: "#D17089" },
  "Data Visualization": { chip: "bg-mSalmon text-black", detailBg: "#FDBA74" },
};

export const getTopicChipClass = (topic) => TOPIC_COLORS[topic]?.chip;
export const getTopicDetailBg = (topic) => TOPIC_COLORS[topic]?.detailBg;

export default TOPIC_COLORS;
