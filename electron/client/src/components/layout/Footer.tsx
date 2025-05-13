import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-popover border-t border-gray-800 p-6 text-center">
      <div className="text-gray-500 text-sm">
        <p>CySploit - Advanced Network Security Analysis Suite</p>
        <p className="mt-1">Version 2.0.1 | License: Free for personal use</p>
      </div>
    </footer>
  );
};

export default Footer;
