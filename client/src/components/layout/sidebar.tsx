import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const userInitials = user.displayName
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <aside className="hidden lg:flex lg:w-64 flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <i className="ri-gamepad-line text-primary text-3xl"></i>
          <h1 className="font-heading text-primary text-2xl">ChoreQuest</h1>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-primary rounded-lg p-4 text-white mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">{user.familyId ? "Smith Family" : "No Family"}</span>
            <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
              <i className="ri-user-line text-xs"></i>
              <span className="text-xs">{user.roleType === "child" ? "Child Mode" : "Parent Mode"}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Avatar className="h-12 w-12 bg-white text-primary">
              <AvatarFallback className="font-bold">{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{user.displayName}</p>
              <div className="flex items-center">
                <span className="text-accent font-bold">{user.points}</span>
                <i className="ri-coin-line ml-1 text-accent"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/">
              <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${location === "/" ? "bg-primary-light/10 text-primary" : "hover:bg-gray-100"}`}>
                <i className="ri-dashboard-line"></i>
                <span>Dashboard</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/chores">
              <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${location === "/chores" ? "bg-primary-light/10 text-primary" : "hover:bg-gray-100"}`}>
                <i className="ri-task-line"></i>
                <span>My Chores</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/rewards">
              <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${location === "/rewards" ? "bg-primary-light/10 text-primary" : "hover:bg-gray-100"}`}>
                <i className="ri-trophy-line"></i>
                <span>Rewards</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/family">
              <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${location === "/family" ? "bg-primary-light/10 text-primary" : "hover:bg-gray-100"}`}>
                <i className="ri-group-line"></i>
                <span>Family</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/achievements">
              <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${location === "/achievements" ? "bg-primary-light/10 text-primary" : "hover:bg-gray-100"}`}>
                <i className="ri-medal-line"></i>
                <span>Achievements</span>
              </a>
            </Link>
          </li>
          {user.roleType === "parent" && (
            <li>
              <Link href="/api">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${location === "/api" ? "bg-primary-light/10 text-primary" : "hover:bg-gray-100"}`}>
                  <i className="ri-code-line"></i>
                  <span>API Access</span>
                </a>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={() => logout()}
          className="flex w-full items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <i className="ri-logout-box-line"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
