import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import AchievementBadge from "@/components/achievements/achievement-badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Achievements() {
  const { user } = useAuth();
  
  const { data: userAchievements, isLoading: isLoadingUserAchievements } = useQuery({
    queryKey: ['/api/users', user?.id, 'achievements'],
    enabled: !!user,
  });
  
  const { data: allAchievements, isLoading: isLoadingAllAchievements } = useQuery({
    queryKey: ['/api/achievements'],
    enabled: !!user,
  });

  if (!user) return null;

  // Separate earned achievements from available ones
  const earnedAchievementIds = userAchievements?.map(a => a.id) || [];
  const unlockedAchievements = userAchievements || [];
  const lockedAchievements = allAchievements?.filter(a => !earnedAchievementIds.includes(a.id)) || [];

  const isLoading = isLoadingUserAchievements || isLoadingAllAchievements;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-heading text-2xl lg:text-3xl text-gray-800 mb-6">My Achievements</h1>
            
            {isLoading ? (
              <div className="text-center py-8">Loading achievements...</div>
            ) : (
              <>
                <section className="mb-10">
                  <h2 className="text-xl font-heading mb-4">Unlocked ({unlockedAchievements.length})</h2>
                  
                  {unlockedAchievements.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {unlockedAchievements.map(achievement => (
                          <AchievementBadge key={achievement.id} achievement={achievement} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <i className="ri-lock-unlock-line text-4xl text-gray-300 mb-2"></i>
                      <h3 className="text-lg font-bold mb-2">No achievements unlocked yet</h3>
                      <p className="text-gray-600">Complete chores and tasks to earn achievements!</p>
                    </div>
                  )}
                </section>
                
                <section>
                  <h2 className="text-xl font-heading mb-4">Locked ({lockedAchievements.length})</h2>
                  
                  {lockedAchievements.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lockedAchievements.map(achievement => (
                          <div key={achievement.id} className="flex items-center space-x-3 bg-gray-100 rounded-lg p-2 opacity-60">
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white">
                              <i className="ri-lock-line text-xl"></i>
                            </div>
                            <div>
                              <p className="font-bold">{achievement.name}</p>
                              <p className="text-xs text-gray-600">{achievement.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <i className="ri-trophy-line text-4xl text-success mb-2"></i>
                      <h3 className="text-lg font-bold mb-2">You've unlocked all achievements!</h3>
                      <p className="text-gray-600">Congratulations, you're a ChoreQuest champion!</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
