import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Navbar from './Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
  toggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children
}) => {
  return (
    <div className="page-container">
      {/* Navbar - top navigation */}
      <Navbar />
      
      {/* Main Content */}
      <div className="content-container no-sidebar">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default PageLayout;
