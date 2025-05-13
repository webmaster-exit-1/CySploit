// filepath: /home/mrgfy/CySploit/client/src/pages/BackendTest.tsx
import React, { useEffect, useState } from "react";

const BackendTest: React.FC = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return <div>{message ? message : "Loading..."}</div>;
};

export default BackendTest;