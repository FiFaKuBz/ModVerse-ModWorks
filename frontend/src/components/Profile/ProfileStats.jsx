import CustomButton from "../common/CustomButton";

export default function ProfileStats({ followers = 0, following = 0 }) {
  return (
    <div className="flex flex-col items-center mt-4 px-4">
      <p className="text-lg sm:text-sm md:text-base text-black font-semibold">
        {followers} followers | {following} following
      </p>

      <div className="flex gap-[37px] mt-4 flex-wrap justify-center">
        <CustomButton variant="share">Share</CustomButton>
        <CustomButton variant="edit">Edit Profile</CustomButton>
      </div>
    </div>
  );
}
