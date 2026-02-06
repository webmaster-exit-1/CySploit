import React from 'react';
import { Helmet } from 'react-helmet';

const Resources: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Security Resources | PenTools</title>
        <meta name="description" content="Cybersecurity resources and API information for penetration testing and security assessment." />
      </Helmet>

      <div className="w-full h-[calc(100vh-220px)]">
        <iframe
          title="Security Resources"
          src="/pentools-styled-apis.html"
          className="w-full h-full rounded-lg border border-gray-800 bg-black"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </>
  );
};

export default Resources;