import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddMemberFormProps {
  onClose: () => void;
}

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required"),
  roleType: z.enum(["parent", "child"], {
    required_error: "Please select a role type",
  }),
  avatarColor: z.string().min(1, "Please select an avatar color"),
});

const avatarColors = [
  { value: "#FF5733", label: "Red" },
  { value: "#33FF57", label: "Green" },
  { value: "#3357FF", label: "Blue" },
  { value: "#F3FF33", label: "Yellow" },
  { value: "#FF33F3", label: "Pink" },
  { value: "#33FFF3", label: "Cyan" },
  { value: "#FF8C33", label: "Orange" },
  { value: "#8C33FF", label: "Purple" },
];

export default function AddMemberForm({ onClose }: AddMemberFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      roleType: "child",
      avatarColor: "#FF5733",
    },
  });

  const addMember = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const userData = {
        ...data,
        familyId: user?.familyId,
      };

      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Family member added",
        description: "The new member has been added to your family successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/families', user?.familyId, 'members'] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error adding family member",
        description: error instanceof Error 
          ? error.message 
          : "Failed to add family member. Please try again.",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    addMember.mutate(data);
    setIsSubmitting(false);
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Family Member</DialogTitle>
        <DialogDescription>
          Create a new account for a family member. They will be added to your family.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter display name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="roleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="avatarColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar Color</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select avatar color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {avatarColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}