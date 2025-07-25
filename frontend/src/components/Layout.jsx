import { useState } from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="transition-all duration-300 ease-in-out flex-1 justify-center items-start">
        {children}
      </main>
    </div>
  );
};

export default Layout;
