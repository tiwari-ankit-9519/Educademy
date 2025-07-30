import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Sidebar from "./Sidebar";
import { Megaphone } from "lucide-react";
import { clearLastAnnouncementNotification } from "@/features/common/notificationSlice";

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] =
    useState(false);

  const dispatch = useDispatch();
  const { lastAnnouncementNotification } = useSelector(
    (state) => state.notification
  );

  useEffect(() => {
    if (lastAnnouncementNotification && !isAnnouncementDialogOpen) {
      setIsAnnouncementDialogOpen(true);
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";

      setTimeout(() => {
        setIsAnnouncementDialogOpen(false);
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
        dispatch(clearLastAnnouncementNotification());
      }, 5000);
    }
  }, [lastAnnouncementNotification, isAnnouncementDialogOpen, dispatch]);

  return (
    <>
      {isAnnouncementDialogOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => e.preventDefault()}
          onKeyDown={(e) => e.preventDefault()}
        >
          <div
            className="relative max-w-2xl mx-auto bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white border-0 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300"
            style={{
              position: "relative",
              maxWidth: "32rem",
              margin: "0 auto",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>
            <div className="relative z-10 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <Megaphone className="w-12 h-12 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  📢 System Announcement
                </h2>

                {lastAnnouncementNotification && (
                  <>
                    <h3 className="text-xl font-semibold text-white/95">
                      {lastAnnouncementNotification.title}
                    </h3>

                    <p className="text-white/90 text-lg leading-relaxed max-w-lg mx-auto">
                      {lastAnnouncementNotification.message}
                    </p>
                  </>
                )}

                <div className="flex justify-center items-center space-x-2 text-white/80 text-sm mt-6">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                  <span>This message will disappear automatically</span>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
};

export default Layout;
