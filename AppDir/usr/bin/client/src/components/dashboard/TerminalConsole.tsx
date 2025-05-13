import React, { useEffect, useRef } from 'react';
import NeonBorder from '@/components/common/NeonBorder';
import { useTerminal } from '@/lib/hooks/useTerminal';
import { cn } from '@/lib/utils';

interface TerminalConsoleProps {
  maxHeight?: string;
  showControls?: boolean;
}

const TerminalConsole: React.FC<TerminalConsoleProps> = ({ 
  maxHeight = "h-80", 
  showControls = true 
}) => {
  const { 
    commands, 
    inputValue, 
    setInputValue, 
    handleSubmit, 
    handleKeyDown, 
    inputRef, 
    commandsEndRef,
    focusInput,
    isProcessing
  } = useTerminal();
  
  // Auto focus the terminal input if clicked anywhere in the terminal
  const terminalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const terminal = terminalRef.current;
    
    if (terminal) {
      const handleClick = () => {
        focusInput();
      };
      
      terminal.addEventListener('click', handleClick);
      
      return () => {
        terminal.removeEventListener('click', handleClick);
      };
    }
  }, [focusInput]);

  return (
    <NeonBorder color="cyan">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
          <i className="ri-terminal-line mr-2 text-primary"></i>
          Terminal Console
        </h2>
        {showControls && (
          <div className="flex space-x-1">
            <button className="w-3 h-3 rounded-full bg-destructive"></button>
            <button className="w-3 h-3 rounded-full bg-yellow-500"></button>
            <button className="w-3 h-3 rounded-full bg-green-500"></button>
          </div>
        )}
      </div>
      
      <div 
        ref={terminalRef}
        className={cn("bg-black p-4 overflow-y-auto font-mono text-sm terminal-output", maxHeight)}
      >
        {commands.length === 0 ? (
          <pre className="text-gray-400">
            Welcome to CySploit Terminal.
            Type 'help' to see available commands.
          </pre>
        ) : (
          commands.map((cmd) => (
            <div key={cmd.id} className="mb-2">
              {cmd.command && (
                <pre>
                  <span className="text-primary">root@cysploit</span>
                  <span className="text-gray-400">:</span>
                  <span className="text-primary">~$</span> 
                  <span className="text-white"> {cmd.command}</span>
                </pre>
              )}
              {cmd.output && (
                <pre className={cn(cmd.isError ? "text-destructive" : "text-gray-400")}>
                  {cmd.output}
                </pre>
              )}
            </div>
          ))
        )}
        
        {/* Current command line with cursor */}
        <pre>
          <span className="text-primary">root@cysploit</span>
          <span className="text-gray-400">:</span>
          <span className="text-primary">~$</span> 
          <span className={cn("text-white", isProcessing ? "" : "terminal-cursor")}> {inputValue}</span>
        </pre>
        
        {/* Reference for auto-scrolling */}
        <div ref={commandsEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-primary"
              disabled={isProcessing}
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary"
              disabled={isProcessing}
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </form>
      </div>
    </NeonBorder>
  );
};

export default TerminalConsole;
