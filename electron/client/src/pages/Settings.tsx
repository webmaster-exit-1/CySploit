import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import NeonBorder from '@/components/common/NeonBorder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

const interfaceSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  theme: z.enum(['system', 'dark', 'darker', 'cyberpunk']),
  accentColor: z.enum(['cyan', 'magenta', 'purple', 'green']),
  animationsEnabled: z.boolean(),
});

const apiSettingsSchema = z.object({
  shodanApiKey: z.string().optional(),
  customServicesPath: z.string().default('./client/src/assets/my_services.txt'),
  metasploitHost: z.string().default('localhost'),
  metasploitPort: z.string().regex(/^\d+$/).default('55553'),
  metasploitUsername: z.string().default('msf'),
  metasploitPassword: z.string().default('password'),
  metasploitPath: z.string().default('/usr/share/metasploit-framework'),
});

const scanSettingsSchema = z.object({
  defaultScanTimeout: z.number().min(5).max(120),
  portScanRange: z.string().regex(/^\d+(-\d+)?$/),
  autoSaveResults: z.boolean(),
  scanningThreads: z.number().min(1).max(50),
  defaultInterface: z.string().min(1, 'Please select an interface'),
});

const notificationSchema = z.object({
  enableNotifications: z.boolean(),
  criticalAlerts: z.boolean(),
  scanCompletionAlerts: z.boolean(),
  newDeviceAlerts: z.boolean(),
  emailNotifications: z.boolean(),
  emailAddress: z.string().email().optional().or(z.literal('')),
});

const Settings: React.FC = () => {
  const { toast } = useToast();
  const { accentColor, setAccentColor } = useTheme();
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Set page title
  useEffect(() => {
    document.title = 'Settings | CySploit';
  }, []);
  
  // API settings form
  const apiSettingsForm = useForm<z.infer<typeof apiSettingsSchema>>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      shodanApiKey: '',
      customServicesPath: './client/src/assets/my_services.txt',
      metasploitHost: 'localhost',
      metasploitPort: '55553',
      metasploitUsername: 'msf',
      metasploitPassword: 'password',
      metasploitPath: '/usr/share/metasploit-framework',
    }
  });
  
  // Interface settings form
  const interfaceForm = useForm<z.infer<typeof interfaceSchema>>({
    resolver: zodResolver(interfaceSchema),
    defaultValues: {
      username: 'User',
      theme: 'dark',
      accentColor: accentColor, // Use the current accent color from context
      animationsEnabled: true,
    }
  });
  
  // Scan settings form
  const scanSettingsForm = useForm<z.infer<typeof scanSettingsSchema>>({
    resolver: zodResolver(scanSettingsSchema),
    defaultValues: {
      defaultScanTimeout: 30,
      portScanRange: '1-1024',
      autoSaveResults: true,
      scanningThreads: 10,
      defaultInterface: 'eth0',
    }
  });
  
  // Notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      enableNotifications: true,
      criticalAlerts: true,
      scanCompletionAlerts: true,
      newDeviceAlerts: false,
      emailNotifications: false,
      emailAddress: '',
    }
  });
  
  // Form submission handlers
  const onApiSettingsSubmit = async (values: z.infer<typeof apiSettingsSchema>) => {
    try {
      // Save Shodan API key
      await fetch('/api/settings/shodan_api_key', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.shodanApiKey }),
      });
      
      // Save services file path
      await fetch('/api/settings/services_file_path', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.customServicesPath }),
      });
      
      // Save Metasploit configuration
      await fetch('/api/settings/metasploit_host', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.metasploitHost }),
      });
      
      await fetch('/api/settings/metasploit_port', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.metasploitPort }),
      });
      
      await fetch('/api/settings/metasploit_username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.metasploitUsername }),
      });
      
      await fetch('/api/settings/metasploit_password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.metasploitPassword }),
      });
      
      await fetch('/api/settings/metasploit_path', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: values.metasploitPath }),
      });
      
      toast({
        title: "API Settings Saved",
        description: "Your API settings have been updated.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: "There was a problem saving your API settings.",
        variant: "destructive",
      });
      console.error('API settings error:', error);
    }
  };
  
  const onInterfaceSubmit = (values: z.infer<typeof interfaceSchema>) => {
    toast({
      title: "Interface Settings Saved",
      description: "Your interface preferences have been updated.",
    });
    console.log('Interface settings:', values);
    
    // Apply accent color from settings
    setAccentColor(values.accentColor);
    
    // Apply animation settings
    setAnimationsEnabled(values.animationsEnabled);
  };
  
  const onScanSettingsSubmit = (values: z.infer<typeof scanSettingsSchema>) => {
    toast({
      title: "Scan Settings Saved",
      description: "Your scan settings have been updated.",
    });
    console.log('Scan settings:', values);
  };
  
  const onNotificationSubmit = (values: z.infer<typeof notificationSchema>) => {
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
    });
    console.log('Notification settings:', values);
  };

  return (
    <>
      <Helmet>
        <title>Settings | CySploit</title>
        <meta name="description" content="Configure application settings and preferences" />
      </Helmet>
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Application <span className="text-primary">Settings</span></h1>
        <p className="text-gray-400">Configure application preferences and scanning behavior</p>
      </div>
      
      {/* Settings Tabs */}
      <Tabs defaultValue="interface" className="mb-8">
        <div className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="interface">Interface</TabsTrigger>
            <TabsTrigger value="scanning">Scanning</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="apis">API Keys</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Interface Settings */}
        <TabsContent value="interface">
          <NeonBorder color="cyan">
            <CardHeader>
              <CardTitle className="font-rajdhani">Interface Settings</CardTitle>
              <CardDescription>
                Customize the application appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...interfaceForm}>
                <form onSubmit={interfaceForm.handleSubmit(onInterfaceSubmit)} className="space-y-6">
                  <FormField
                    control={interfaceForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Username" {...field} />
                        </FormControl>
                        <FormDescription>
                          This name will appear in the terminal and logs
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={interfaceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="darker">Darker</SelectItem>
                            <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Change the application theme
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={interfaceForm.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color</FormLabel>
                        <div className="flex space-x-2">
                          {['cyan', 'magenta', 'purple', 'green'].map(color => (
                            <div 
                              key={color}
                              className={`
                                w-8 h-8 rounded-full cursor-pointer transition-all
                                ${field.value === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}
                              `}
                              style={{ 
                                backgroundColor: 
                                  color === 'cyan' ? '#00FFFF' : 
                                  color === 'magenta' ? '#FF00FF' : 
                                  color === 'purple' ? '#9D00FF' : 
                                  '#00FF66'
                              }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          Choose your preferred accent color
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={interfaceForm.control}
                    name="animationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel>Animations</FormLabel>
                          <FormDescription>
                            Enable UI animations and transitions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Save Interface Settings</Button>
                </form>
              </Form>
            </CardContent>
          </NeonBorder>
        </TabsContent>
        
        {/* Scanning Settings */}
        <TabsContent value="scanning">
          <NeonBorder color="magenta">
            <CardHeader>
              <CardTitle className="font-rajdhani">Scan Settings</CardTitle>
              <CardDescription>
                Configure scanning behavior and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...scanSettingsForm}>
                <form onSubmit={scanSettingsForm.handleSubmit(onScanSettingsSubmit)} className="space-y-6">
                  <FormField
                    control={scanSettingsForm.control}
                    name="defaultInterface"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Network Interface</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interface" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="eth0">eth0</SelectItem>
                            <SelectItem value="wlan0">wlan0</SelectItem>
                            <SelectItem value="en0">en0</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default interface for network scanning operations
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={scanSettingsForm.control}
                    name="defaultScanTimeout"
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>Default Scan Timeout (seconds)</FormLabel>
                        <div className="flex items-center space-x-4">
                          <Slider 
                            defaultValue={[value]}
                            min={5}
                            max={120}
                            step={5}
                            onValueChange={(vals) => onChange(vals[0])}
                            className="flex-1"
                          />
                          <div className="w-12 text-center font-mono bg-background py-1 rounded">
                            {value}s
                          </div>
                        </div>
                        <FormDescription>
                          Maximum time to wait for scanning operations
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={scanSettingsForm.control}
                    name="portScanRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Port Scan Range</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1-1024 or 80" {...field} />
                        </FormControl>
                        <FormDescription>
                          Range of ports to scan (e.g. 1-1024, or single port)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={scanSettingsForm.control}
                    name="scanningThreads"
                    render={({ field: { value, onChange } }) => (
                      <FormItem>
                        <FormLabel>Scanning Threads</FormLabel>
                        <div className="flex items-center space-x-4">
                          <Slider 
                            defaultValue={[value]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(vals) => onChange(vals[0])}
                            className="flex-1"
                          />
                          <div className="w-12 text-center font-mono bg-background py-1 rounded">
                            {value}
                          </div>
                        </div>
                        <FormDescription>
                          Number of concurrent scanning threads
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={scanSettingsForm.control}
                    name="autoSaveResults"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-save Results</FormLabel>
                          <FormDescription>
                            Automatically save scan results
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Save Scan Settings</Button>
                </form>
              </Form>
            </CardContent>
          </NeonBorder>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <NeonBorder color="purple">
            <CardHeader>
              <CardTitle className="font-rajdhani">Notification Settings</CardTitle>
              <CardDescription>
                Configure alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="enableNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Notifications</FormLabel>
                          <FormDescription>
                            Show system notifications for events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4 p-4 border border-gray-800 rounded-lg">
                    <h4 className="font-medium text-sm">Notification Types</h4>
                    
                    <FormField
                      control={notificationForm.control}
                      name="criticalAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Critical Vulnerabilities</FormLabel>
                            <FormDescription className="text-xs">
                              Alert when critical vulnerabilities are found
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationForm.watch('enableNotifications')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="scanCompletionAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Scan Completion</FormLabel>
                            <FormDescription className="text-xs">
                              Alert when scans are completed
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationForm.watch('enableNotifications')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="newDeviceAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">New Devices</FormLabel>
                            <FormDescription className="text-xs">
                              Alert when new devices join the network
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!notificationForm.watch('enableNotifications')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border border-gray-800">
                        <div className="space-y-0.5">
                          <FormLabel>Email Notifications</FormLabel>
                          <FormDescription>
                            Send important alerts to your email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!notificationForm.watch('enableNotifications')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="emailAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your@email.com" 
                            {...field} 
                            disabled={!notificationForm.watch('emailNotifications') || !notificationForm.watch('enableNotifications')}
                          />
                        </FormControl>
                        <FormDescription>
                          Email address to receive notifications
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Save Notification Settings</Button>
                </form>
              </Form>
            </CardContent>
          </NeonBorder>
        </TabsContent>
        
        {/* API Settings */}
        <TabsContent value="apis">
          <NeonBorder color="green">
            <CardHeader>
              <CardTitle className="font-rajdhani">API Integration</CardTitle>
              <CardDescription>
                Configure external API connections for enhanced scanning capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apiSettingsForm}>
                <form onSubmit={apiSettingsForm.handleSubmit(onApiSettingsSubmit)} className="space-y-6">
                  <FormField
                    control={apiSettingsForm.control}
                    name="shodanApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shodan API Key</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your Shodan API key" 
                            {...field} 
                            type="password"
                          />
                        </FormControl>
                        <FormDescription>
                          Your Shodan API key for enhanced reconnaissance capabilities. 
                          This key allows scanning internet-connected devices.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiSettingsForm.control}
                    name="customServicesPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Services File Path</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Path to custom services file" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Path to your custom nmap services database file for enhanced service detection
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col space-y-2 p-4 bg-black/30 rounded-md border border-gray-800">
                    <h3 className="text-sm font-medium text-primary">Data Visualization Features</h3>
                    <p className="text-xs text-gray-400">
                      Scan results from Shodan can be visualized in 3D, similar to SandDance in VS Code. 
                      The reporting format is inspired by Jok3r to provide comprehensive security assessment reports.
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span className="text-xs text-gray-300">Requires a valid Shodan API key</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6 border p-4 rounded-lg mt-8 mb-4 border-green-600/30">
                    <h3 className="text-lg font-medium text-green-500">Metasploit Integration</h3>
                    <p className="text-gray-400 text-sm">Configure connection to the Metasploit RPC API</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={apiSettingsForm.control}
                        name="metasploitHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Metasploit Host</FormLabel>
                            <FormControl>
                              <Input placeholder="localhost" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={apiSettingsForm.control}
                        name="metasploitPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Metasploit Port</FormLabel>
                            <FormControl>
                              <Input placeholder="55553" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={apiSettingsForm.control}
                        name="metasploitUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="msf" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={apiSettingsForm.control}
                        name="metasploitPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={apiSettingsForm.control}
                      name="metasploitPath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metasploit Installation Path</FormLabel>
                          <FormControl>
                            <Input placeholder="/usr/share/metasploit-framework" {...field} />
                          </FormControl>
                          <FormDescription>
                            Path to Metasploit Framework installation
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">Save API Settings</Button>
                </form>
              </Form>
            </CardContent>
          </NeonBorder>
        </TabsContent>
      </Tabs>
      
      {/* About Section */}
      <NeonBorder color="cyan" className="mb-8">
        <CardHeader>
          <CardTitle className="font-rajdhani">About CySploit</CardTitle>
          <CardDescription>
            Advanced Network Security Analysis Suite
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Version Information</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between px-3 py-2 bg-background rounded-lg">
                <span className="text-gray-400">Version</span>
                <span className="font-mono">2.0.1</span>
              </li>
              <li className="flex justify-between px-3 py-2 bg-background rounded-lg">
                <span className="text-gray-400">Build Date</span>
                <span className="font-mono">{new Date().toLocaleDateString()}</span>
              </li>
              <li className="flex justify-between px-3 py-2 bg-background rounded-lg">
                <span className="text-gray-400">License</span>
                <span className="font-mono">Free for personal use</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">System Information</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between px-3 py-2 bg-background rounded-lg">
                <span className="text-gray-400">Platform</span>
                <span className="font-mono">{navigator.platform}</span>
              </li>
              <li className="flex justify-between px-3 py-2 bg-background rounded-lg">
                <span className="text-gray-400">Browser</span>
                <span className="font-mono">{navigator.userAgent.split(') ')[0].split(' (')[0]}</span>
              </li>
              <li className="flex justify-between px-3 py-2 bg-background rounded-lg">
                <span className="text-gray-400">Language</span>
                <span className="font-mono">{navigator.language}</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-800 mt-4 pt-4 flex justify-between">
          <div className="text-xs text-gray-500">
            CySploit © {new Date().getFullYear()} - All rights reserved
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm">
              <i className="ri-github-line mr-1"></i>
              Source
            </Button>
            <Button variant="ghost" size="sm">
              <i className="ri-file-text-line mr-1"></i>
              Documentation
            </Button>
          </div>
        </CardFooter>
      </NeonBorder>
    </>
  );
};

export default Settings;
