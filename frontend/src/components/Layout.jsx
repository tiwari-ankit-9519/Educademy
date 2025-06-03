import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "./Navbar";
import SidebarNavigation from "@/components/Sidebar";

const Layout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - Only on desktop */}
        <SidebarNavigation />

        {/* Main content area */}
        <SidebarInset className="flex-1">
          {/* Navbar */}
          <Navbar />

          {/* Page content */}
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
