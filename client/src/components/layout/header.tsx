import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function Header() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const userInitials = user.displayName
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <header className="bg-white shadow-sm lg:hidden">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <i className="ri-gamepad-line text-primary text-2xl"></i>
          <h1 className="font-heading text-primary text-xl">ChoreQuest</h1>
        </div>
        <div className="flex items-center">
          <div className="mr-4 flex items-center">
            <span className="text-accent-dark font-bold">{user.points}</span>
            <i className="ri-coin-line ml-1 text-accent"></i>
          </div>
          <Avatar className="h-10 w-10 bg-primary text-white">
            <AvatarFallback className="font-bold">{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="bg-primary px-4 py-2 flex items-center justify-between text-white">
        <span className="text-sm font-bold">{user.familyId ? "Smith Family" : "No Family"}</span>
        <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
          <i className="ri-user-line text-xs"></i>
          <span className="text-xs">{user.roleType === "child" ? "Child Mode" : "Parent Mode"}</span>
        </div>
      </div>
    </header>
  );
}
