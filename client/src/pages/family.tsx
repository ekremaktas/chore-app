import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MemberCard from "@/components/family/member-card";
import AddMemberForm from "@/components/family/add-member-form";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Family() {
  const { user } = useAuth();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  
  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['/api/families', user?.familyId, 'members'],
    enabled: !!user?.familyId,
  });
  
  const isParent = user?.roleType === "parent";
  
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="font-heading text-2xl lg:text-3xl text-gray-800">Family Members</h1>
              
              {isParent && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-2 sm:mt-0">
                      <i className="ri-user-add-line mr-1.5"></i>
                      Add Family Member
                    </Button>
                  </DialogTrigger>
                  <AddMemberForm onClose={() => setAddMemberOpen(false)} />
                </Dialog>
              )}
            </div>
            
            {!isParent && (
              <Alert className="mb-6">
                <i className="ri-information-line h-4 w-4 mr-2"></i>
                <AlertTitle>Parent accounts can add new family members</AlertTitle>
                <AlertDescription>
                  Only parent accounts can add new family members. If you need to add someone, ask a parent in your family to do it.
                </AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : familyMembers && familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {familyMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="flex justify-center">
                  <i className="ri-group-line text-5xl text-gray-300 mb-4"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">No family members found</h3>
                <p className="text-gray-600 mb-4">
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
