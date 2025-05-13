import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider } from "./contexts/ThemeContext";
import './lib/aframeShim';

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found!");
}

createRoot(root).render(
  <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </NextThemeProvider>
);
