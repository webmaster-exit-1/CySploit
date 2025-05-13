import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Shodan search suggestions/examples for tab completion
const SHODAN_FILTERS = [
  { filter: 'port:', description: 'Filter by port number (e.g., port:22)', example: 'port:22' },
  { filter: 'country:', description: 'Filter by two-letter country code', example: 'country:US' },
  { filter: 'city:', description: 'Filter by city name', example: 'city:"San Francisco"' },
  { filter: 'geo:', description: 'Filter by coordinates', example: 'geo:"37.7697,-122.3933"' },
  { filter: 'org:', description: 'Filter by organization name', example: 'org:"Amazon"' },
  { filter: 'hostname:', description: 'Filter by hostname', example: 'hostname:example.com' },
  { filter: 'net:', description: 'Filter by IP range', example: 'net:192.168.0.0/16' },
  { filter: 'os:', description: 'Filter by operating system', example: 'os:"Windows Server 2012"' },
  { filter: 'has_screenshot:', description: 'Filter by availability of screenshots', example: 'has_screenshot:true' },
  { filter: 'before:', description: 'Filter by date before', example: 'before:22/02/2022' },
  { filter: 'after:', description: 'Filter by date after', example: 'after:22/01/2022' },
  { filter: 'bitcoin.ip:', description: 'Filter by Bitcoin nodes', example: 'bitcoin.ip:any' },
  { filter: 'product:', description: 'Filter by product name', example: 'product:"Apache"' },
  { filter: 'version:', description: 'Filter by software version', example: 'version:"2.4.1"' },
  { filter: 'vuln:', description: 'Filter by vulnerability identifier', example: 'vuln:CVE-2021-44228' },
  { filter: 'http.title:', description: 'Filter by HTTP title', example: 'http.title:"Admin Login"' },
  { filter: 'http.status:', description: 'Filter by HTTP status code', example: 'http.status:200' },
  { filter: 'http.component:', description: 'Filter by HTTP components', example: 'http.component:"jQuery"' },
  { filter: 'ssl:', description: 'Filter by SSL/TLS presence', example: 'ssl:true' },
  { filter: 'has_ssl:', description: 'Filter by SSL/TLS presence (legacy)', example: 'has_ssl:true' },
  { filter: 'ssl.cert.subject.cn:', description: 'Filter by SSL certificate CN', example: 'ssl.cert.subject.cn:example.com' },
  { filter: 'tag:', description: 'Filter by Shodan tag', example: 'tag:ics' },
  { filter: 'device:', description: 'Filter by device type', example: 'device:webcam' },
];

// Shodan search presets/examples for quick use
const SHODAN_PRESETS = [
  { name: 'Internet cameras', query: 'webcam has_screenshot:true country:US' },
  { name: 'Vulnerable Apache Log4j', query: 'vuln:CVE-2021-44228' },
  { name: 'Unprotected databases', query: 'product:MongoDB port:27017' },
  { name: 'Industrial control systems', query: 'tag:ics country:US' },
  { name: 'Remote desktop services', query: 'port:3389 os:"Windows"' },
  { name: 'Kubernetes dashboard', query: 'http.title:"Kubernetes Dashboard"' },
  { name: 'Jenkins servers', query: 'product:Jenkins' },
  { name: 'Exposed Docker APIs', query: 'port:2375 product:"Docker"' },
  { name: 'SCADA systems', query: 'tag:scada' },
  { name: 'Exposed IoT devices', query: 'has_screenshot:true device:webcam' },
];

// Mock Shodan results data structure
interface ShodanResult {
  ip: string;
  port: number;
  hostnames: string[];
  country_name: string;
  org: string;
  isp: string;
  os: string | null;
  timestamp: string;
  product: string;
  version: string | null;
  vulns: string[] | null;
}

// Main ShodanSearch component
const ShodanSearch = (): JSX.Element => {
  const [location] = useLocation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ filter: string, description: string, example: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<ShodanResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('search');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [apiKey, setApiKey] = useState(''); // Added for API key input
  const [saveKeyLoading, setSaveKeyLoading] = useState(false); // Added for API key saving state
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Routes for Navbar consistency
  const routes = [
    { path: '/', label: 'Dashboard', icon: 'ri-dashboard-line' },
    { path: '/network-discovery', label: 'Network Discovery', icon: 'ri-radar-line' },
    { path: '/vulnerability-scanner', label: 'Vulnerability Scanner', icon: 'ri-code-box-line' },
    { path: '/packet-inspector', label: 'Packet Inspector', icon: 'ri-file-search-line' },
    { path: '/network-mapping', label: 'Network Mapping', icon: 'ri-router-line' },
    { path: '/terminal', label: 'Terminal', icon: 'ri-terminal-box-line' },
    { path: '/sessions', label: 'Sessions', icon: 'ri-folder-line' },
  ];

  // Custom navbar for consistency
  const CustomNavbar = () => {
    return (
      <nav className="bg-background/95 backdrop-blur-sm border-b border-gray-800 py-2 sticky top-0 z-40 w-full">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-primary text-2xl font-bold font-rajdhani flex items-center mr-6">
              <i className="ri-shield-keyhole-line mr-2"></i>
              <span>CySploit</span>
            </div>

            <div className="hidden lg:flex space-x-1">
              {routes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md transition text-sm font-medium cursor-pointer",
                      location === route.path
                        ? "text-primary bg-muted"
                        : "text-gray-300 hover:bg-muted/50"
                    )}
                  >
                    <i className={cn(route.icon, "mr-2")}></i>
                    {route.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-primary hover:text-white hover:bg-primary/20 hover:border-primary neon-border-cyan"
                >
                  <i className="ri-menu-3-line mr-1"></i> Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-muted/95 backdrop-blur-md border border-primary/70 text-gray-200 neon-border-cyan rounded-md p-1">
                {/* Core features - linked to pages */}
                <Link href="/">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-dashboard-line mr-2 text-cyan-400"></i> Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/network-discovery">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-radar-line mr-2 text-yellow-400"></i> Network Discovery
                  </DropdownMenuItem>
                </Link>
                <Link href="/vulnerability-scanner">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-code-box-line mr-2 text-red-400"></i> Vulnerability Scanner
                  </DropdownMenuItem>
                </Link>
                <Link href="/packet-inspector">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-file-search-line mr-2 text-green-400"></i> Packet Inspector
                  </DropdownMenuItem>
                </Link>
                <Link href="/network-mapping">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-router-line mr-2 text-purple-400"></i> Network Mapping
                  </DropdownMenuItem>
                </Link>
                <Link href="/terminal">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-terminal-box-line mr-2 text-blue-400"></i> Terminal
                  </DropdownMenuItem>
                </Link>
                <Link href="/sessions">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-folder-line mr-2 text-orange-400"></i> Sessions
                  </DropdownMenuItem>
                </Link>

                {/* Resources Section */}
                <DropdownMenuItem className="font-bold pt-2 pb-2 border-t border-primary/30 mt-1 mb-1 cursor-default text-primary">
                  <i className="ri-folder-shield-2-fill mr-2 text-primary"></i> Resources
                </DropdownMenuItem>

                <Link href="/pentools">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-code-s-slash-line mr-2 text-green-400"></i> PenTools
                  </DropdownMenuItem>
                </Link>

                {/* API Keys Section */}
                <DropdownMenuItem className="font-bold pt-2 pb-2 border-t border-primary/30 mt-1 mb-1 cursor-default text-primary">
                  <i className="ri-key-2-fill mr-2 text-secondary"></i> API Integration
                </DropdownMenuItem>

                <Link href="/shodan">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-spy-line mr-2 text-red-400"></i> Shodan API
                  </DropdownMenuItem>
                </Link>
                <Link href="/metasploit-console">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-terminal-box-line mr-2 text-green-400"></i> Metasploit Console
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/settings">
              <div className={cn(
                "px-3 py-2 rounded-md transition text-sm font-medium flex items-center cursor-pointer border",
                location === "/settings"
                  ? "text-white bg-primary/20 border-primary neon-border-cyan"
                  : "text-primary border-primary/50 hover:text-white hover:bg-primary/20 hover:border-primary neon-border-cyan"
              )}>
                <i className="ri-settings-3-fill mr-2"></i>
                Settings
              </div>
            </Link>
          </div>
        </div>
      </nav>
    );
  };

  // Initialize component and check for real Shodan API key
  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Check if a real Shodan API key exists in the database
    fetch('/api/shodan/info')
      .then(response => response.json())
      .then(data => {
        if (data.error && data.error.includes('not configured')) {
          // No API key found
          setHasApiKey(false);
        } else {
          // Valid API key exists
          setHasApiKey(true);
        }
      })
      .catch(error => {
        console.error('Error checking Shodan API key:', error);
        setHasApiKey(false);
      });
  }, []);

  // Handle tab-completion for search query
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Check if the input has a partial filter keyword for suggestions
    const words = value.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord && lastWord.length > 0) {
      const matchingFilters = SHODAN_FILTERS.filter(
        filter => filter.filter.toLowerCase().startsWith(lastWord.toLowerCase())
      );

      setSuggestions(matchingFilters);
      setShowSuggestions(matchingFilters.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Apply a suggestion to the query input
  const applySuggestion = (suggestion: { filter: string, example: string }) => {
    const words = query.split(' ');
    words.pop(); // Remove the last partial word

    // Add the suggested filter
    const newQuery = [...words, suggestion.filter].join(' ');
    setQuery(newQuery);
    setShowSuggestions(false);

    // Focus the input after applying suggestion
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Use a preset search query
  const usePreset = (preset: { name: string, query: string }) => {
    setQuery(preset.query);
    // Focus the input after applying preset
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle form submission for search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    // Make actual API call to backend which uses real Shodan API
    fetch('/api/shodan/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        // Process real results from Shodan
        const results = data.matches?.map((match: any) => ({
          ip: match.ip_str,
          port: match.port,
          hostnames: match.hostnames || [],
          country_name: match.location?.country_name,
          org: match.org,
          isp: match.isp,
          os: match.os,
          timestamp: match.timestamp,
          product: match.product,
          version: match.version,
          vulns: match.vulns
        })) || [];

        setSearchResults(results);

        // Show toast notification for search completion
        toast({
          title: "Search completed",
          description: `Found ${results.length} results for "${query}"`,
        });
      })
      .catch(error => {
        console.error('Error searching Shodan:', error);
        toast({
          title: "Search error",
          description: error.message,
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };  // Properly close the handleSearch function

  // Function removed - we no longer use mock data generation
  // Using real Shodan API endpoints instead

  // Handle saving the API key
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Shodan API key.",
        variant: "destructive",
      });
      return;
    }
    setSaveKeyLoading(true);
    fetch('/api/shodan/save-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "API Key Saved",
            description: "Your Shodan API key has been saved successfully.",
          });
          setHasApiKey(true); // Assume key is now valid and proceed
        } else {
          throw new Error(data.error || 'Failed to save API key');
        }
      })
      .catch(error => {
        console.error('Error saving Shodan API key:', error);
        toast({
          title: "Error Saving API Key",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setSaveKeyLoading(false);
      });
  };

  // Check if we need to prompt for API key
  if (!hasApiKey) {
    return (
      <>
        <CustomNavbar />
        <div className="container mx-auto py-8">
          <div className="max-w-md mx-auto bg-muted rounded-lg p-8 border border-primary/50">
            <div className="text-center mb-6">
              <i className="ri-spy-line text-4xl text-red-400 mb-2"></i>
              <h1 className="text-2xl font-bold text-white">Shodan API Setup</h1>
              <p className="text-gray-400 mt-2">To use Shodan search functionality, you need to provide your API key</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Shodan API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="Enter your Shodan API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim() || saveKeyLoading}
                >
                  {saveKeyLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    'Save API Key'
                  )}
                </Button>
              </div>

              <div className="text-xs text-gray-400 mt-4">
                <p>Don't have a Shodan API key? <a href="https://account.shodan.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Sign up at Shodan.io</a></p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomNavbar />
      <div className="container mx-auto py-4">
        <div className="border-2 border-blue-600 neon-border-blue bg-black rounded-lg p-2 mb-6 flex items-center">
          <i className="ri-spy-line text-blue-500 text-2xl mr-2"></i>
          <h1 className="text-xl font-bold text-blue-500">Shodan Search</h1>
        </div>

        <Tabs defaultValue="search" className="mb-6" onValueChange={setSelectedTab}>
          <TabsList className="w-full bg-background/90 border border-blue-600/30 neon-border-blue-subtle rounded-lg p-1">
            <TabsTrigger
              value="search"
              className={cn(
                "rounded-md flex-1 font-semibold",
                selectedTab === "search" && "data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-400"
              )}
            >
              <i className="ri-search-line mr-1"></i> Search
            </TabsTrigger>
            <TabsTrigger
              value="presets"
              className={cn(
                "rounded-md flex-1 font-semibold",
                selectedTab === "presets" && "data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-400"
              )}
            >
              <i className="ri-list-check mr-1"></i> Search Presets
            </TabsTrigger>
            <TabsTrigger
              value="cheatsheet"
              className={cn(
                "rounded-md flex-1 font-semibold",
                selectedTab === "cheatsheet" && "data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-400"
              )}
            >
              <i className="ri-file-list-line mr-1"></i> Cheatsheet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Enter Shodan search query (e.g., 'apache port:443 country:US')"
                    className="bg-muted border-2 border-blue-600/50 neon-border-blue-subtle rounded-lg py-6 text-lg pl-4 pr-10 placeholder:text-gray-400"
                  />
                  {query && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-100"
                      onClick={() => setQuery('')}
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white min-w-[120px] py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Searching
                    </>
                  ) : (
                    <>
                      <i className="ri-search-line mr-2"></i>
                      Search
                    </>
                  )}
                </Button>
              </div>

              {/* Search suggestions */}
              {showSuggestions && (
                <div className="absolute mt-1 w-full bg-background border border-blue-600/30 neon-border-blue-subtle rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 cursor-pointer hover:bg-muted/40 flex justify-between"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <div>
                        <span className="text-blue-400 font-mono">{suggestion.filter}</span>
                      </div>
                      <div className="text-gray-400 text-sm truncate ml-4">
                        {suggestion.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="bg-muted/50 border border-blue-600/30 neon-border-blue-subtle rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-blue-400">
                  <i className="ri-search-eye-line mr-2"></i>
                  Search Results ({searchResults.length})
                </h2>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-700">
                        <TableHead className="text-blue-400">IP Address</TableHead>
                        <TableHead className="text-blue-400">Port</TableHead>
                        <TableHead className="text-blue-400">Location</TableHead>
                        <TableHead className="text-blue-400">Service</TableHead>
                        <TableHead className="text-blue-400">Organization</TableHead>
                        <TableHead className="text-blue-400">Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((result, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-gray-800 hover:bg-muted/80 cursor-pointer"
                        >
                          <TableCell className="font-mono">
                            {result.ip}
                            {result.hostnames.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">{result.hostnames[0]}</div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono">{result.port}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">{result.country_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-gray-300">{result.product}</div>
                            {result.version && (
                              <div className="text-xs text-gray-400">v{result.version}</div>
                            )}
                            {result.vulns && result.vulns.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {result.vulns.map((vuln, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-red-900/50 text-red-300 text-xs rounded-sm"
                                  >
                                    {vuln}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{result.org}</TableCell>
                          <TableCell className="text-sm text-gray-400">
                            {new Date(result.timestamp).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="presets" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {SHODAN_PRESETS.map((preset, index) => (
                <div
                  key={index}
                  className="bg-muted border border-blue-600/30 neon-border-blue-subtle rounded-lg p-4 hover:bg-muted/80 cursor-pointer transition-colors"
                  onClick={() => usePreset(preset)}
                >
                  <h3 className="text-blue-400 font-semibold mb-2">
                    <i className="ri-search-eye-line mr-2"></i>
                    {preset.name}
                  </h3>
                  <div className="font-mono text-sm text-gray-300 bg-background/40 p-2 rounded-md">
                    {preset.query}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cheatsheet" className="mt-4">
            <div className="bg-muted/50 border border-blue-600/30 neon-border-blue-subtle rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-blue-400">
                <i className="ri-file-list-line mr-2"></i>
                Shodan Search Filters
              </h2>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-700">
                      <TableHead className="text-blue-400 w-1/5">Filter</TableHead>
                      <TableHead className="text-blue-400 w-3/5">Description</TableHead>
                      <TableHead className="text-blue-400 w-1/5">Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SHODAN_FILTERS.map((filter, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-gray-800 hover:bg-muted/80"
                      >
                        <TableCell className="font-mono font-medium text-white">{filter.filter}</TableCell>
                        <TableCell>{filter.description}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-background/70 rounded-md text-xs text-blue-400 font-mono">
                            {filter.example}
                          </code>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="ml-2 text-gray-400 hover:text-blue-400"
                                  onClick={() => setQuery(filter.example)}
                                >
                                  <i className="ri-search-line"></i>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Use this example</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ShodanSearch;