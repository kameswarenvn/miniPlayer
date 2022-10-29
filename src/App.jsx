import React from "react";
import "./App.css";
import MiniPlayer from "./components/mini-player";

function App() {
  const STREAM_PLAYBACK_URL =
    //  "https://vjs.zencdn.net/v/oceans.mp4"
    "https://3d26876b73d7.us-west-2.playback.live-video.net/api/video/v1/us-west-2.913157848533.channel.xJ2tVekwmMGd.m3u8";

  return (
    <div className="app">
      <div className="vid">
        <MiniPlayer streamUrl={STREAM_PLAYBACK_URL} />
      </div>
    </div>
  );
}

export default App;
