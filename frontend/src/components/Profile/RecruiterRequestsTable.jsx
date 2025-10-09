export default function RecruiterRequestsTable({ requests }) {
  return (
    <div className="mt-10 w-full flex justify-center">
      <div className="w-full max-w-[1000px] rounded-2xl border border-[#D35400] bg-[#D35400] text-white font-['Anuphan'] overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-3 text-center font-semibold text-base bg-[#D35400]/90 py-3 rounded-t-2xl">
          <div>Recruiter Name</div>
          <div>Email</div>
          <div>Date</div>
        </div>

        {/* Body Rows */}
        <div className="bg-[#D35400]/90 divide-y divide-white/30">
          {requests.map((r, index) => (
            <div
              key={index}
              className="grid grid-cols-3 text-center text-sm sm:text-base py-3 hover:bg-[#D35400]/80 transition"
            >
              <a
                href="#"
                className="text-white underline hover:text-white/80"
              >
                {r.name}
              </a>
              <span>{r.email}</span>
              <span>{r.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
