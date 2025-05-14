import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface CompletionModalProps {
  show: boolean;
  onClose: () => void;
  points: number;
  choreName: string;
}

export default function CompletionModal({ show, onClose, points, choreName }: CompletionModalProps) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-checkbox-circle-line text-5xl text-success"></i>
          </div>
          <h3 className="font-heading text-2xl mb-2">Awesome job!</h3>
          <p className="text-gray-600 mb-4">
            You completed "{choreName}" and earned {points} points!
          </p>
          
          <div className="bg-accent/10 p-4 rounded-lg mb-6 font-bold text-accent-dark text-xl flex items-center justify-center">
            <i className="ri-coin-line mr-2"></i> +{points} points
          </div>
          
          <Link href="/rewards">
            <Button className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors">
              View Rewards
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full py-3 text-gray-500 mt-2"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
