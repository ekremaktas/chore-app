import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Family() {
  const { user } = useAuth();
  
  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['/api/families', user?.familyId, 'members'],
    enabled: !!user?.familyId,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-heading text-2xl lg:text-3xl text-gray-800 mb-6">Family Members</h1>
            
            {isLoading ? (
              <div className="text-center py-8">Loading family members...</div>
            ) : familyMembers && familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familyMembers.map(member => {
                  const userInitials = member.displayName
                    .split(" ")
                    .map((name) => name[0])
                    .join("");
                    
                  // Progress to next level (100 points per level)
                  const progressToNextLevel = (member.points % 100) || 100;
                  
                  return (
                    <Card key={member.id} className="overflow-hidden">
                      <CardHeader className={`bg-${member.roleType === "parent" ? "secondary" : "primary"}/10 pb-0`}>
                        <CardTitle className="flex items-center">
                          <Avatar className={`h-12 w-12 mr-3 bg-${member.roleType === "parent" ? "secondary" : "primary"}`}>
                            <AvatarFallback className="text-white font-bold">{userInitials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-lg font-bold">{member.displayName}</p>
                            <p className="text-sm text-gray-600 capitalize">{member.roleType}</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {member.roleType === "child" && (
                          <>
                            <div className="flex justify-between items-center mb-2 mt-2">
                              <p className="text-sm font-medium">Level {member.level}</p>
                              <p className="text-sm font-medium">{progressToNextLevel}%</p>
                            </div>
                            <Progress value={progressToNextLevel} className="h-2 mb-4" />
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <i className="ri-coin-line text-accent mr-1"></i>
                                <span className="font-bold text-accent-dark">{member.points} points</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {100 - (member.points % 100)} points to level {member.level + 1}
                              </span>
                            </div>
                          </>
                        )}
                        {member.roleType === "parent" && (
                          <div className="flex items-center mt-3">
                            <i className="ri-shield-star-line text-secondary mr-2 text-xl"></i>
                            <span>Family Administrator</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="ri-group-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-bold mb-2">No family members found</h3>
                <p className="text-gray-600">
                  You don't seem to be part of a family yet.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
