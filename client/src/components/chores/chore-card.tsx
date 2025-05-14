import { useState } from "react";
import { Chore } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CompletionModal from "@/components/shared/completion-modal";
import { format } from "date-fns";

interface ChoreCardProps {
  chore: Chore;
}

export default function ChoreCard({ chore }: ChoreCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedChorePoints, setCompletedChorePoints] = useState(0);
  const [completedChoreName, setCompletedChoreName] = useState("");

  const formatTime = (date: Date | null) => {
    if (!date) return "No due date";
    return format(new Date(date), "h:mm a");
  };

  const completeChore = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chores/${chore.id}/complete`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setCompletedChorePoints(chore.points);
      setCompletedChoreName(chore.name);
      setShowCompletionModal(true);
      queryClient.invalidateQueries({ queryKey: ['/api/chores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete chore. Please try again."
      });
    }
  });

  const getChoreIcon = () => {
    return chore.isCompleted 
      ? <i className="ri-check-line text-xl"></i>
      : <i className={`${chore.icon} text-xl`}></i>;
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow ${chore.isCompleted ? "opacity-70" : ""}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <div className={`w-12 h-12 rounded-lg ${chore.isCompleted ? "bg-success/10 text-success" : "bg-primary/10 text-primary"} flex items-center justify-center`}>
              {getChoreIcon()}
            </div>
          </div>
          <div className="flex-grow">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg">{chore.name}</h4>
                <p className="text-sm text-gray-600">{chore.description}</p>
              </div>
              <Badge variant="accent" className="text-accent-dark font-bold px-2 py-1 rounded text-sm">
                +{chore.points} pts
              </Badge>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <i className="ri-time-line"></i>
                <span>
                  {chore.isCompleted 
                    ? `Completed at ${formatTime(chore.completedAt)}` 
                    : `Due by ${formatTime(chore.dueDate)}`}
                </span>
              </div>
              {!chore.isCompleted && user && chore.assignedToId === user.id && (
                <Button 
                  onClick={() => completeChore.mutate()}
                  disabled={completeChore.isPending}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-bold text-sm"
                >
                  {completeChore.isPending ? "Saving..." : "Complete"}
                </Button>
              )}
              {chore.isCompleted && (
                <span className="px-4 py-2 bg-success text-white rounded-lg font-bold text-sm flex items-center">
                  <i className="ri-check-line mr-1"></i> Done
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <CompletionModal 
        show={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        points={completedChorePoints}
        choreName={completedChoreName}
      />
    </>
  );
}
