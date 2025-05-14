import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ChoreCard from "@/components/chores/chore-card";
import ChoreForm from "@/components/chores/chore-form";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Chores() {
  const { user } = useAuth();
  const [addChoreOpen, setAddChoreOpen] = useState(false);
  
  const { data: chores, isLoading } = useQuery({
    queryKey: ['/api/chores'],
    enabled: !!user,
  });

  if (!user) return null;

  const isParent = user.roleType === "parent";
  
  // Filter chores by status
  const pendingChores = chores?.filter(chore => !chore.isCompleted) || [];
  const completedChores = chores?.filter(chore => chore.isCompleted) || [];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-heading text-2xl lg:text-3xl text-gray-800">My Chores</h1>
              {isParent && (
                <Button 
                  onClick={() => setAddChoreOpen(true)}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <i className="ri-add-line mr-1"></i> Add Chore
                </Button>
              )}
            </div>
            
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="pending" className="text-center">
                  <i className="ri-time-line mr-1"></i> Pending
                  <span className="ml-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                    {pendingChores.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-center">
                  <i className="ri-check-line mr-1"></i> Completed
                  <span className="ml-1 bg-success/10 text-success rounded-full px-2 py-0.5 text-xs">
                    {completedChores.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {isLoading ? (
                  <div className="text-center py-8">Loading chores...</div>
                ) : pendingChores.length > 0 ? (
                  pendingChores.map(chore => (
                    <ChoreCard key={chore.id} chore={chore} />
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <i className="ri-checkbox-circle-line text-5xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-bold mb-2">All caught up!</h3>
                    <p className="text-gray-600">
                      You don't have any pending chores right now.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {isLoading ? (
                  <div className="text-center py-8">Loading chores...</div>
                ) : completedChores.length > 0 ? (
                  completedChores.map(chore => (
                    <ChoreCard key={chore.id} chore={chore} />
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <i className="ri-todo-line text-5xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-bold mb-2">No completed chores yet</h3>
                    <p className="text-gray-600">
                      Complete some chores to see them here!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <Dialog open={addChoreOpen} onOpenChange={setAddChoreOpen}>
        <ChoreForm onClose={() => setAddChoreOpen(false)} />
      </Dialog>
      
      <MobileNav />
    </div>
  );
}
