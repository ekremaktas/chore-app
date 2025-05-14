import { useState } from "react";
import { useAuthContext } from "@/context/auth-context";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Custom hook that provides auth functionality and a login modal
export function useAuth() {
  const auth = useAuthContext();
  const [showLoginModal, setShowLoginModal] = useState(!auth.user && !auth.isLoading);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await auth.login(data.username, data.password);
      setShowLoginModal(false);
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const LoginModal = () => (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-2xl mb-2">Welcome to ChoreQuest!</DialogTitle>
          <div className="flex justify-center mb-4">
            <i className="ri-gamepad-line text-primary text-4xl"></i>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="font-semibold text-sm">Demo Parent Account</p>
              <p className="text-xs text-gray-600">Username: parent</p>
              <p className="text-xs text-gray-600">Password: parent123</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="font-semibold text-sm">Demo Child Account</p>
              <p className="text-xs text-gray-600">Username: jake</p>
              <p className="text-xs text-gray-600">Password: jake123</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
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
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark"
                disabled={auth.isLoading}
              >
                {auth.isLoading ? "Logging in..." : "Log in"}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );

  return {
    ...auth,
    LoginModal,
  };
}
