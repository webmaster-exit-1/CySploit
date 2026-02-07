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
        {/* This iframe loads our own trusted, static HTML content (pentools-styled-apis.html)
            which contains a Matrix-style canvas animation and security resource links.
            allow-scripts is required for the canvas animation, and allow-same-origin
            is needed to load the content from the same origin. This is safe because
            the content is static, part of our application bundle, and not user-generated. */}
        {/* eslint-disable @eslint-react/dom/no-unsafe-iframe-sandbox */}
        <iframe
          title="Security Resources"
          src="/pentools-styled-apis.html"
          className="w-full h-full rounded-lg border border-gray-800 bg-black"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        {/* eslint-enable @eslint-react/dom/no-unsafe-iframe-sandbox */}
      </div>
    </>
  );
};

export default Resources;