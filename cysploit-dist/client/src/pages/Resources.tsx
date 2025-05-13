import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

const Resources: React.FC = () => {
  useEffect(() => {
    // Redirect to the HTML resource
    window.location.href = '/resources/pentools-apis.html';
  }, []);

  return (
    <>
      <Helmet>
        <title>Security Resources | PenTools</title>
        <meta name="description" content="Cybersecurity resources and API information for penetration testing and security assessment." />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Redirecting to Resources...</h1>
          <p className="mt-2">You will be redirected to the Penetration Testing Resources page.</p>
        </div>
      </div>
    </>
  );
};

export default Resources;