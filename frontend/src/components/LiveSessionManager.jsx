import React, { useState, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Hand,
  MessageCircle,
  Users,
  Phone,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocketContext } from "./SocketProvider";

const LiveSessionManager = ({ sessionId, courseId, onLeave }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [volume, setVolume] = useState(100);

  const {
    joinLiveSession,
    leaveLiveSession,
    sendLiveInteraction,
    shareScreen,
    liveSessionParticipants,
  } = useSocketContext();

  const participantCount = liveSessionParticipants.get(sessionId) || 0;

  useEffect(() => {
    if (sessionId && courseId) {
      joinLiveSession(sessionId, courseId);
    }

    return () => {
      if (sessionId) {
        leaveLiveSession(sessionId);
      }
    };
  }, [sessionId, courseId, joinLiveSession, leaveLiveSession]);

  const toggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    sendLiveInteraction(sessionId, "video_toggle", { enabled: newState });
  };

  const toggleAudio = () => {
    const newState = !isAudioOn;
    setIsAudioOn(newState);
    sendLiveInteraction(sessionId, "audio_toggle", { enabled: newState });
  };

  const toggleScreenShare = () => {
    const newState = !isScreenSharing;
    setIsScreenSharing(newState);
    shareScreen(sessionId, newState);
  };

  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    sendLiveInteraction(sessionId, "hand_raise", { raised: newState });
  };

  const sendReaction = (reaction) => {
    sendLiveInteraction(sessionId, "reaction", { emoji: reaction });
  };

  const handleLeaveSession = () => {
    leaveLiveSession(sessionId);
    if (onLeave) {
      onLeave();
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Video className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Live Session
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
            >
              <Users className="w-3 h-3 mr-1" />
              {participantCount}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
            >
              LIVE
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-slate-900 rounded-lg aspect-video flex items-center justify-center relative">
          <div className="text-white text-center">
            <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm opacity-75">Video Stream</p>
          </div>

          {isScreenSharing && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Monitor className="w-3 h-3 mr-1" />
                Sharing Screen
              </Badge>
            </div>
          )}

          {handRaised && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-700"
              >
                <Hand className="w-3 h-3 mr-1" />
                Hand Raised
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-2">
          <Button
            variant={isVideoOn ? "default" : "destructive"}
            size="sm"
            onClick={toggleVideo}
            className="h-10 w-10 rounded-full p-0"
          >
            {isVideoOn ? (
              <Video className="w-4 h-4" />
            ) : (
              <VideoOff className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant={isAudioOn ? "default" : "destructive"}
            size="sm"
            onClick={toggleAudio}
            className="h-10 w-10 rounded-full p-0"
          >
            {isAudioOn ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="sm"
            onClick={toggleScreenShare}
            className="h-10 w-10 rounded-full p-0"
          >
            {isScreenSharing ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <MonitorOff className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant={handRaised ? "default" : "outline"}
            size="sm"
            onClick={toggleHandRaise}
            className="h-10 w-10 rounded-full p-0"
          >
            <Hand className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="h-10 w-10 rounded-full p-0"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeaveSession}
            className="h-10 w-10 rounded-full p-0"
          >
            <Phone className="w-4 h-4 rotate-[135deg]" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVolume(volume > 0 ? 0 : 100)}
            >
              {volume > 0 ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
            />
          </div>

          <div className="flex space-x-1">
            {["👍", "👏", "❤️", "😄", "🤔"].map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => sendReaction(emoji)}
                className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>

        {chatOpen && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                Live Chat
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="h-32 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 p-2 text-xs">
              <p className="text-slate-500 dark:text-slate-400 text-center">
                Chat messages will appear here...
              </p>
            </div>
            <div className="flex mt-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-l bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    sendLiveInteraction(sessionId, "chat", {
                      message: e.target.value,
                    });
                    e.target.value = "";
                  }
                }}
              />
              <Button
                size="sm"
                className="rounded-l-none px-3 py-1 h-auto text-xs"
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveSessionManager;
