import { z } from "zod";
import { insertChoreSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const choreIcons = [
  { value: "ri-delete-bin-line", label: "Trash", description: "Taking out trash" },
  { value: "ri-book-line", label: "Homework", description: "Study and assignments" },
  { value: "ri-home-line", label: "Home", description: "General home chores" },
  { value: "ri-broom-line", label: "Cleaning", description: "Cleaning tasks" },
  { value: "ri-shirt-line", label: "Laundry", description: "Laundry tasks" },
  { value: "ri-plant-line", label: "Garden", description: "Gardening tasks" },
  { value: "ri-restaurant-line", label: "Kitchen", description: "Kitchen chores" },
  { value: "ri-shopping-cart-line", label: "Shopping", description: "Shopping errands" },
  { value: "ri-brush-line", label: "Art", description: "Art projects" },
  { value: "ri-psychotherapy-line", label: "Pets", description: "Pet care" },
];

interface ChoreFormProps {
  onClose: () => void;
}

export default function ChoreForm({ onClose }: ChoreFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formSchema = insertChoreSchema.extend({
    dueDate: z.string().min(1, "Due date is required"),
    dueTime: z.string().min(1, "Due time is required"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      points: 30,
      icon: "ri-delete-bin-line",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: "17:00",
      assignedToId: 0,
      familyId: user?.familyId || 0,
      createdBy: user?.id,
    },
  });

  // Fetch family members using the users endpoint
  const { data: familyMembers } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user?.familyId,
  });

  // Filter for child members from the same family
  const childMembers = Array.isArray(familyMembers) ? 
    familyMembers.filter((member: any) => 
      member.roleType === "child" && member.familyId === user?.familyId
    ) : [];

  const createChore = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Combine date and time
      const combinedDate = new Date(`${data.dueDate}T${data.dueTime}`);
      
      // Make sure the date is valid
      if (isNaN(combinedDate.getTime())) {
        throw new Error("Invalid date format");
      }
      
      const choreData = {
        name: data.name,
        description: data.description,
        points: data.points,
        icon: data.icon,
        dueDate: combinedDate, // Send as Date object, not string
        assignedToId: data.assignedToId,
        familyId: user?.familyId || 0,
        createdBy: user?.id,
      };
      
      const res = await apiRequest("POST", "/api/chores", choreData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Chore created",
        description: "The chore has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chores'] });
      onClose();
    },
    onError: (error) => {
      console.error("Chore creation error:", error);
      toast({
        variant: "destructive",
        title: "Error Creating Chore",
        description: error instanceof Error 
          ? error.message 
          : "Failed to create chore. Please check all fields and try again.",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    createChore.mutate(data);
  }

  return (
    <DialogContent className="max-w-md mx-auto">
      <DialogHeader>
        <DialogTitle className="font-heading text-xl">Add New Chore</DialogTitle>
        <DialogDescription>Create a new chore to assign to a family member.</DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chore Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Clean bedroom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add details about the chore" 
                    className="resize-none" 
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 30" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {choreIcons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center">
                            <i className={`${icon.value} mr-2`}></i>
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="assignedToId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign To</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select child" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {childMembers.map((child: any) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.displayName || child.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white font-bold"
              disabled={createChore.isPending}
            >
              {createChore.isPending ? "Adding..." : "Add Chore"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
