import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';

const MetasploitConsole: React.FC = () => {
  const [location] = useLocation();
  const [output, setOutput] = useState<string[]>([
    'Starting Metasploit Framework Console...',
    'Connecting to PostgreSQL database...',
    'Initializing modules...'
  ]);
  const [command, setCommand] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Initialize Metasploit console and connect to database
  useEffect(() => {
    // Make a real Metasploit initialization call
    fetch('/api/metasploit/init-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          setOutput(prev => [
            ...prev,
            `[-] Error: ${data.error}`,
            'Please check your Metasploit settings and try again.',
            '',
            'msf6 > '
          ]);
        } else {
          // Use the real response data
          setOutput(prev => [
            ...prev,
            'Connected to PostgreSQL database.',
            data.message || 'Metasploit Framework loaded successfully.',
            '',
            'msf6 > '
          ]);
        }
        setIsInitialized(true);
      })
      .catch(error => {
        console.error('Error initializing Metasploit:', error);
        setOutput(prev => [
          ...prev,
          `[-] Error: ${error.message}`,
          'Failed to initialize Metasploit. Please check your settings.',
          '',
          'msf6 > '
        ]);
        setIsInitialized(true);
      });

    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when clicking anywhere on terminal
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Process command
    setOutput(prev => [...prev, `msf6 > ${command}`]);

    // Add processing indicator
    setOutput(prev => [...prev, 'Processing command...']);

    try {
      // Handle exit command locally to avoid unnecessary API calls
      if (command === 'exit' || command === 'quit') {
        setOutput(prev => [
          ...prev.slice(0, -1), // Remove the "Processing command..." line
          'Exiting Metasploit Console...',
          'Session terminated.',
        ]);
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
        return;
      }

      // Send command to the server using the real Metasploit API
      const response = await fetch('/api/metasploit/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      // Remove the "Processing command..." line
      setOutput(prev => prev.slice(0, -1));

      if (result.success) {
        // Split the output by newlines and add each line to the terminal
        const lines = result.data.output.split('\n');
        setOutput(prev => [...prev, ...lines, 'msf6 > ']);
      } else {
        // Show error message
        setOutput(prev => [
          ...prev,
          `[-] Error: ${result.error || 'Unknown error occurred'}`,
          '',
          'msf6 > '
        ]);
      }
    } catch (error) {
      console.error('Error executing Metasploit command:', error);
      
      // Remove the "Processing command..." line
      setOutput(prev => prev.slice(0, -1));
      
      // Show error message
      setOutput(prev => [
        ...prev,
        `[-] Error: ${error instanceof Error ? error.message : 'Failed to execute command'}`,
        `[-] Make sure Metasploit is properly configured in Settings`,
        '',
        'msf6 > '
      ]);
    }

    // Clear command input
    setCommand('');
  };

  // Handle keyboard navigation through command history
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-4">
        <div className="border-2 border-red-600 neon-border-red bg-black rounded-lg p-2 mb-6 flex items-center">
          <i className="ri-terminal-fill text-red-500 text-2xl mr-2"></i>
          <h1 className="text-xl font-bold text-red-500">Metasploit Framework Console</h1>
        </div>

        <div className="relative bg-black text-white rounded-lg border-2 border-red-600 neon-border-red p-4 font-mono text-sm">
          <div 
            ref={terminalRef}
            className="h-[calc(100vh-200px)] overflow-y-auto mb-2 whitespace-pre-wrap"
            onClick={handleTerminalClick}
          >
            {output.map((line, index) => (
              <div key={index} className={
                line.includes('[-]') ? 'text-red-500' : 
                line.includes('[+]') ? 'text-green-500' : 
                line.includes('[*]') ? 'text-blue-500' : 
                line.startsWith('msf6') ? 'text-red-500' :
                line.includes('Command') || line.includes('Description') || line.includes('============') ? 'text-yellow-500' :
                'text-gray-200'
              }>
                {line}
              </div>
            ))}
          </div>
          
          {isInitialized && (
            <form onSubmit={handleCommand} className="flex items-center">
              <span className="text-red-500 mr-1">msf6 &gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-white"
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-red-700">
            <h3 className="text-red-500 text-sm font-medium mb-2">Common Commands</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li><code className="text-red-400">help</code> - Display help menu</li>
              <li><code className="text-red-400">search &lt;term&gt;</code> - Search for modules</li>
              <li><code className="text-red-400">use &lt;module&gt;</code> - Select a module</li>
              <li><code className="text-red-400">sessions</code> - List active sessions</li>
              <li><code className="text-red-400">db_status</code> - Show database status</li>
              <li><code className="text-red-400">exit</code> - Exit the console</li>
            </ul>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg border border-red-700">
            <h3 className="text-red-500 text-sm font-medium mb-2">Example Workflows</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>1. <code className="text-red-400">search type:exploit platform:windows</code></li>
              <li>2. <code className="text-red-400">use exploit/windows/smb/ms17_010_eternalblue</code></li>
              <li>3. <code className="text-red-400">set RHOSTS 192.168.1.10</code></li>
              <li>4. <code className="text-red-400">run</code> or <code className="text-red-400">exploit</code></li>
            </ul>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg border border-red-700">
            <h3 className="text-red-500 text-sm font-medium mb-2">Database Integration</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li><code className="text-red-400">db_status</code> - Check database connectivity</li>
              <li><code className="text-red-400">db_nmap</code> - Run nmap and record results</li>
              <li><code className="text-red-400">hosts</code> - List hosts in database</li>
              <li><code className="text-red-400">vulns</code> - List vulnerabilities in database</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default MetasploitConsole;