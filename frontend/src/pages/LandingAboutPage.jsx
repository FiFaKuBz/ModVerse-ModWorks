// frontend/src/pages/LandingAboutPage.jsx
import LandingHeader from "../components/Landing/LandingHeader";

export default function LandingAboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader variant="login" />
      
      <main className="flex-grow px-4 py-20 bg-mOrange text-white"> 
        <div className="max-w-3xl mx-auto"> 
          
          {/* <<< MODIFIED: Changed `items-center` to `items-baseline` */}
          <h1 className="text-5xl font-bold font-At mb-12 flex items-baseline gap-4">
            <span>About</span>
            
            {/* <<< MODIFIED: Removed `flex-grow` and added a fixed width (e.g., w-64) */}
            <span className="w-20 h-1 bg-white w-64"></span> 
          </h1>
          
          <div className="space-y-5 font-An text-medium leading-relaxed">
            <p>
              ModVerse ModWorks is a space where creativity meets collaboration.
              
              We <span className="font-bold text-mYellow">craft, share, and refine</span> that transform ideas into immersive experiences.
            </p>
            <p>
              Our mission is to empower everyone alike by building tools, stories,
              and worlds that go beyond the ordinary.
            </p>
            <p>
              From concept to execution, ModVerse ModWorks is driven by <span className="font-bold text-mYellow">passion, community</span>,
              and a relentless pursuit of innovation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
