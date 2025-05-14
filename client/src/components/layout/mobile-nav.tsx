import { Link, useLocation } from "wouter";
import { useState } from "react";
import ChoreForm from "@/components/chores/chore-form";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;
  
  const isParent = user.roleType === "parent";
  
  return (
    <>
      <nav className="lg:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-5 h-16">
          <Link href="/">
            <a className={`flex flex-col items-center justify-center ${location === "/" ? "text-primary" : "text-gray-500"}`}>
              <i className="ri-dashboard-line text-xl"></i>
              <span className="text-xs mt-1">Home</span>
            </a>
          </Link>
          <Link href="/chores">
            <a className={`flex flex-col items-center justify-center ${location === "/chores" ? "text-primary" : "text-gray-500"}`}>
              <i className="ri-task-line text-xl"></i>
              <span className="text-xs mt-1">Chores</span>
            </a>
          </Link>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white -mt-5">
              <i className="ri-add-line text-xl"></i>
            </div>
          </button>
          <Link href="/rewards">
            <a className={`flex flex-col items-center justify-center ${location === "/rewards" ? "text-primary" : "text-gray-500"}`}>
              <i className="ri-trophy-line text-xl"></i>
              <span className="text-xs mt-1">Rewards</span>
            </a>
          </Link>
          <Link href="/family">
            <a className={`flex flex-col items-center justify-center ${location === "/family" ? "text-primary" : "text-gray-500"}`}>
              <i className="ri-group-line text-xl"></i>
              <span className="text-xs mt-1">Family</span>
            </a>
          </Link>
        </div>
      </nav>
      
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        {isParent ? <ChoreForm onClose={() => setIsAddOpen(false)} /> : 
          <div className="p-6 text-center">
            <h2 className="text-xl font-heading mb-4">Only parents can add chores</h2>
            <p className="text-gray-600 mb-4">Ask your parent to add new chores for you!</p>
            <button 
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Close
            </button>
          </div>
        }
      </Dialog>
    </>
  );
}
