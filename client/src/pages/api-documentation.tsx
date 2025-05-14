import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocumentation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  
  const { data: family } = useQuery({
    queryKey: ['/api/families', user?.familyId],
    enabled: !!user?.familyId && user?.roleType === "parent",
  });
  
  if (!user) return null;
  
  // Only parent users should access this page
  if (user.roleType !== "parent") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow flex">
          <Sidebar />
          
          <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="ri-lock-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-bold mb-2">Parent Access Required</h3>
                <p className="text-gray-600 mb-4">
                  This section is only available for parent accounts.
                </p>
              </div>
            </div>
          </main>
        </div>
        
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-heading text-2xl lg:text-3xl text-gray-800 mb-6">API Documentation</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">What is the API?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    The ChoreQuest API allows you to connect your smart home devices, 
                    automation systems, and custom applications to your family's chore management.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 text-sm list-disc pl-5 space-y-1">
                    <li>Smart home integration</li>
                    <li>Voice assistant commands</li>
                    <li>Custom reward systems</li>
                    <li>Family calendar integration</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    All API requests require a valid API key. The API key must be passed 
                    in the Authorization header as <code>Bearer YOUR_API_KEY</code>.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="flex items-center">
                    <div className="bg-gray-200 text-gray-800 p-2 rounded flex-grow font-mono text-sm overflow-x-auto">
                      {isKeyVisible ? (family?.apiKey || "No API Key Available") : "••••••••••••••••••••••••••••••"}
                    </div>
                    <Button 
                      onClick={() => {
                        setIsKeyVisible(!isKeyVisible);
                        
                        if (!isKeyVisible && family?.apiKey) {
                          navigator.clipboard.writeText(family.apiKey)
                            .then(() => {
                              toast({
                                title: "Copied to clipboard",
                                description: "API key has been copied to your clipboard",
                              });
                            })
                            .catch(() => {
                              toast({
                                variant: "destructive",
                                title: "Failed to copy",
                                description: "Could not copy API key to clipboard",
                              });
                            });
                        }
                      }}
                      className="ml-2 px-3 py-2 bg-primary text-white rounded"
                    >
                      <i className={`ri-${isKeyVisible ? "clipboard-line" : "eye-line"}`}></i>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Keep your API key secure. Do not share it publicly or expose it in client-side code.
                </p>
              </CardContent>
            </Card>
            
            <Tabs defaultValue="get-chores" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                <TabsTrigger value="get-chores">GET Chores</TabsTrigger>
                <TabsTrigger value="complete-chore">Complete Chore</TabsTrigger>
                <TabsTrigger value="get-rewards">GET Rewards</TabsTrigger>
                <TabsTrigger value="get-family">GET Family</TabsTrigger>
              </TabsList>
              
              <TabsContent value="get-chores">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Chores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Retrieves all chores for a family or specific child.</p>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Endpoint</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>GET /api/external/chores?child_id=123</code>
                      </pre>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Parameters</h4>
                      <ul className="list-disc pl-5 text-gray-600">
                        <li><code>child_id</code> (optional) - Filter chores by child ID</li>
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Example Request</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`fetch('https://api.chorequest.com/api/external/chores?child_id=123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2">Example Response</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`[
  {
    "id": 1,
    "name": "Take out trash",
    "description": "Before dinner time",
    "points": 30,
    "icon": "ri-delete-bin-line",
    "dueDate": "2023-07-20T17:00:00.000Z",
    "isCompleted": false,
    "assignedToId": 123,
    "familyId": 1,
    "completedAt": null,
    "createdBy": 456
  },
  {
    "id": 2,
    "name": "Make bed",
    "description": "Morning routine",
    "points": 20,
    "icon": "ri-home-line",
    "dueDate": "2023-07-20T09:00:00.000Z",
    "isCompleted": true,
    "assignedToId": 123,
    "familyId": 1,
    "completedAt": "2023-07-20T08:15:00.000Z",
    "createdBy": 456
  }
]`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="complete-chore">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Complete Chore</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Marks a chore as completed and awards points to the child.</p>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Endpoint</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>POST /api/external/chores/:id/complete</code>
                      </pre>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Path Parameters</h4>
                      <ul className="list-disc pl-5 text-gray-600">
                        <li><code>id</code> - ID of the chore to complete</li>
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Request Body</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`{
  "child_id": 123
}`}</code>
                      </pre>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Example Request</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`fetch('https://api.chorequest.com/api/external/chores/1/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    child_id: 123
  })
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2">Example Response</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`{
  "id": 1,
  "name": "Take out trash",
  "description": "Before dinner time",
  "points": 30,
  "icon": "ri-delete-bin-line",
  "dueDate": "2023-07-20T17:00:00.000Z",
  "isCompleted": true,
  "assignedToId": 123,
  "familyId": 1,
  "completedAt": "2023-07-20T14:30:45.000Z",
  "createdBy": 456
}`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="get-rewards">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Retrieves all available rewards for the family.</p>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Endpoint</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>GET /api/external/rewards</code>
                      </pre>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Example Request</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`fetch('https://api.chorequest.com/api/external/rewards', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2">Example Response</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`[
  {
    "id": 1,
    "name": "Movie Night",
    "description": "Pick a movie for family night",
    "pointsCost": 100,
    "icon": "ri-movie-line",
    "familyId": 1,
    "isAvailable": true
  },
  {
    "id": 2,
    "name": "Extra Game Time",
    "description": "30 minutes extra gaming",
    "pointsCost": 150,
    "icon": "ri-gamepad-line",
    "familyId": 1,
    "isAvailable": true
  }
]`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="get-family">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Family Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Retrieves all family members associated with the API key.</p>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Endpoint</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>GET /api/external/family/members</code>
                      </pre>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold mb-2">Example Request</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`fetch('https://api.chorequest.com/api/external/family/members', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2">Example Response</h4>
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{`[
  {
    "id": 123,
    "username": "jake",
    "displayName": "Jake Smith",
    "roleType": "child",
    "familyId": 1,
    "points": 250,
    "level": 3,
    "avatarColor": "blue"
  },
  {
    "id": 456,
    "username": "parent",
    "displayName": "Parent Smith",
    "roleType": "parent",
    "familyId": 1,
    "points": 0,
    "level": 1,
    "avatarColor": "purple"
  }
]`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <h3 className="font-bold text-lg mb-4">Integration Examples</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2">Smart Home Example</h4>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`// Example: Complete trash chore when trash bin is emptied
const smartBin = require('smart-bin-sdk');
const API_KEY = 'YOUR_API_KEY';

smartBin.on('empty', async () => {
  // Find the trash chore ID for Jake (child_id = 123)
  const res = await fetch(
    'https://api.chorequest.com/api/external/chores?child_id=123', 
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  
  const chores = await res.json();
  const trashChore = chores.find(c => 
    c.name.toLowerCase().includes('trash') && !c.isCompleted
  );
  
  if (trashChore) {
    // Mark the chore as complete
    await fetch(
      \`https://api.chorequest.com/api/external/chores/\${trashChore.id}/complete\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ child_id: 123 })
      }
    );
    console.log('Trash chore automatically completed!');
  }
});`}</code>
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-bold mb-2">Voice Assistant Example</h4>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`// Example: Voice assistant integration
const assistant = require('voice-assistant-sdk');
const API_KEY = 'YOUR_API_KEY';

// Register intent handler
assistant.intent('CompleteChore', async (params) => {
  const { choreName, childName } = params;
  
  // Get family members
  const membersRes = await fetch(
    'https://api.chorequest.com/api/external/family/members',
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  
  const members = await membersRes.json();
  const child = members.find(m => 
    m.displayName.toLowerCase().includes(childName.toLowerCase())
  );
  
  if (!child) return 'Child not found';
  
  // Get chores for child
  const choresRes = await fetch(
    \`https://api.chorequest.com/api/external/chores?child_id=\${child.id}\`,
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  
  const chores = await choresRes.json();
  const chore = chores.find(c => 
    c.name.toLowerCase().includes(choreName.toLowerCase()) && !c.isCompleted
  );
  
  if (!chore) return 'Chore not found or already completed';
  
  // Complete the chore
  await fetch(
    \`https://api.chorequest.com/api/external/chores/\${chore.id}/complete\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ child_id: child.id })
    }
  );
  
  return \`Marked \${chore.name} as complete for \${child.displayName}\`;
});`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
