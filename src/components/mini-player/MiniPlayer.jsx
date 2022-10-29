import React, { useCallback, useEffect, useRef, useState } from "react";

import Placeholder from "./placeholder";
import PlayerControls from "./PlayerControls";

import { CONTROLS, POSITION } from "./config";
import { isElementInViewport } from "./utils";

import "./MiniPlayer.css";

const CORNER_SPACE = 32;
const DEFAULT_POSITION = "auto";
const TRANSITION = "200ms ease-in-out";

const MiniPlayer = (props) => {
  const videoRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(5);
  const [sound, setSound] = useState(true);

  const { IVSPlayer } = window;
  const { isPlayerSupported } = IVSPlayer;

  const {
    controls = [CONTROLS.mute, CONTROLS.close, CONTROLS.resize],
    position = POSITION.bottomRight,
    height = 154,
    width = 274,
    streamUrl,
    transition,
  } = props;

  const [loading, setLoading] = useState(true);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [muted, setMuted] = useState(false);

  const [playerPosition, setPlayerPosition] = useState({});
  const [playerSize, setPlayerSize] = useState({});

  const player = useRef(null);
  const playerBaseEl = useRef(null);
  // const videoRef = useRef(null);
  const visibleRef = useRef(null);

  // handle case when autoplay with sound is blocked by browser
  useEffect(() => {
    if (!player.current) return;

    setMuted(player.current.isMuted());
  }, [loading]);
  const assignVideoTime = () => {
    var vid = document.getElementById("video1");
    console.log("vid", vid?.duration ?? null);
    console.log("videoRef", videoRef?.current);
    console.log("player", player?.current);
    setVideoTime(vid.duration);
  };

  const videoHandler = (control) => {
    if (control === "play") {
      videoRef.current.play();
      setPlaying(true);
    } else if (control === "pause") {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const fastForward = () => {
    videoRef.current.currentTime = currentTime + 5;
  };

  const revert = () => {
    videoRef.current.currentTime = currentTime - 5;
  };
  // const mute = ()=>{
  //   videoRef.current.volume =
  // }

  window.setInterval(function () {
    setCurrentTime(videoRef.current?.currentTime);
    setProgress((videoRef.current?.currentTime / videoTime) * 100);
  }, 1000);

  const mute = () => {
    console.log("mute", videoRef);
    videoRef.current.muted = true;
    setVolume(0);
    setSound(false);
  };
  const unmute = () => {
    console.log("unmute", videoRef);
    videoRef.current.muted = false;
    setVolume(5);
    setSound(true);
  };

  const volumeOnChange = (e) => {
    console.log("slider", e);
    const value = e?.target?.value ?? 5;
    setVolume(value);
    console.log("volume", videoRef);
    videoRef.current.volume = value;
  };

  const onFullscreenChange = () => {
    console.log("fullscreen");
    const div = document.getElementById("video1");
    if (div.requestFullscreen) div.requestFullscreen();
    else if (div.webkitRequestFullscreen) div.webkitRequestFullscreen();
    else if (div.msRequestFullScreen) div.msRequestFullScreen();
  };

  const updatePlayer = useCallback(
    (isMini) => {
      let top = DEFAULT_POSITION;
      let right = DEFAULT_POSITION;
      let bottom = DEFAULT_POSITION;
      let left = DEFAULT_POSITION;

      let targetPosition = 0;
      let targetHeight = "100%";
      let targetWidth = "100%";

      if (isMini) {
        targetPosition = `${CORNER_SPACE}px`;
        targetHeight = `${height}px`;
        targetWidth = `${width}px`;
      }

      switch (position) {
        case POSITION.topLeft:
          top = targetPosition;
          left = targetPosition;

          break;
        case POSITION.topRight:
          top = targetPosition;
          right = targetPosition;

          break;
        case POSITION.bottomLeft:
          bottom = targetPosition;
          left = targetPosition;

          break;
        default:
          bottom = targetPosition;
          right = targetPosition;
      }

      setPlayerSize({
        height: targetHeight,
        width: targetWidth,
      });
      setPlayerPosition({
        top,
        right,
        bottom,
        left,
      });
    },
    [height, width, position]
  );

  useEffect(() => {
    const { ENDED, PLAYING, READY } = IVSPlayer.PlayerState;
    const { ERROR } = IVSPlayer.PlayerEventType;

    if (!isPlayerSupported) {
      console.warn(
        "The current browser does not support the Amazon IVS player."
      );

      return;
    }

    const onStateChange = () => {
      const playerState = player.current.getState();

      console.log(`Player State - ${playerState}`);
      setLoading(playerState !== PLAYING);
    };

    const onError = (err) => {
      console.warn("Player Event - ERROR:", err);
    };

    player.current = IVSPlayer.create();
    player.current.attachHTMLVideoElement(videoRef.current);
    player.current.load(streamUrl);
    player.current.play();
    console.log("player.current", player.current);
    console.log("player.current duration", player.current?.duration);
    player.current.addEventListener(READY, onStateChange);
    player.current.addEventListener(PLAYING, onStateChange);
    player.current.addEventListener(ENDED, onStateChange);
    player.current.addEventListener(ERROR, onError);
    setTimeout(() => {
      assignVideoTime();
    }, 900);
    return () => {
      player.current.removeEventListener(READY, onStateChange);
      player.current.removeEventListener(PLAYING, onStateChange);
      player.current.removeEventListener(ENDED, onStateChange);
      player.current.removeEventListener(ERROR, onError);
    };
  }, [IVSPlayer, isPlayerSupported, streamUrl]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = isElementInViewport(playerBaseEl.current);

      if (visible === visibleRef.current) return;

      visibleRef.current = visible;

      if (visible && player.current.isPaused()) {
        player.current.play();
      }

      if (!visible) {
        const playerRect = playerBaseEl.current.getBoundingClientRect();
        setPlayerSize({
          height: `${playerRect.height}px`,
          width: `${playerRect.width - CORNER_SPACE}px`,
        });
      }

      setTimeout(() => {
        setIsMiniPlayer(!visible);
      }, 100);
    };

    if (!isPlayerSupported) {
      return;
    }

    onVisibilityChange();
    updatePlayer(visibleRef.current);

    window.addEventListener("scroll", onVisibilityChange);
    window.addEventListener("resize", onVisibilityChange);

    return () => {
      window.removeEventListener("scroll", onVisibilityChange);
      window.removeEventListener("resize", onVisibilityChange);
    };
  }, [isPlayerSupported, updatePlayer]);

  useEffect(() => {
    updatePlayer(isMiniPlayer);
  }, [isMiniPlayer, updatePlayer]);

  const close = () => {
    player.current.pause();
    setIsMiniPlayer(false);
  };

  const resize = () => {
    const { offsetLeft, offsetTop } = playerBaseEl.current;

    window.scrollTo({
      top: offsetTop - 20,
      left: offsetLeft,
      behavior: "smooth",
    });
  };

  const toggleMute = () => {
    const shouldMute = !player.current.isMuted();

    player.current.setMuted(shouldMute);
    setMuted(shouldMute);
  };

  if (!isPlayerSupported) {
    return null;
  }

  const { top, right, bottom, left } = playerPosition;

  return (
    <div className="MiniPlayer" ref={playerBaseEl}>
      <div className="MiniPlayer-videoBox">
        <Placeholder loading={loading} />
        <div className="heading">
          <h3>my video</h3>
        </div>

        <div
          className={`MinPlayer-video${isMiniPlayer ? " small" : ""}`}
          style={{
            top,
            right,
            bottom,
            left,
            width: `${playerSize.width}`,
            height: `${playerSize.height}`,
            transition:
              transition && isMiniPlayer
                ? `height ${TRANSITION}, width ${TRANSITION}`
                : "none",
          }}
        >
          <video id="video1" ref={videoRef} playsInline></video>

          {isMiniPlayer && (
            <PlayerControls
              controls={controls}
              muted={muted}
              onClose={close}
              onResize={resize}
              onMute={toggleMute}
            />
          )}
        </div>
      </div>
      <div className="playControls">
        <img
          onClick={revert}
          className="controlsIcon"
          src="https://img.icons8.com/fluency-systems-regular/48/FFFFFF/replay-5.png"
        />
        {playing ? (
          <img
            onClick={() => videoHandler("pause")}
            className="controlsIcon--small"
            src="https://img.icons8.com/material-outlined/24/FFFFFF/circled-pause.png"
          />
        ) : (
          <img
            onClick={() => videoHandler("play")}
            className="controlsIcon--small"
            src="https://img.icons8.com/ios/50/FFFFFF/play-button-circled--v1.png"
          />
        )}

        <img
          className="controlsIcon"
          onClick={fastForward}
          src="https://img.icons8.com/fluency-systems-regular/48/FFFFFF/forward-5.png"
        />
      </div>
      <div className="timeControls">
        <div className="time_bar">
          <div
            style={{ width: `${progress}%` }}
            className="time_progressBar"
          ></div>
        </div>
        <div className="seekBar">
          <p className="controlsTime">
            {Math.floor(currentTime / 60) +
              ":" +
              ("0" + Math.floor(currentTime % 60)).slice(-2)}
          </p>
          <span className="divider">
            <p>/</p>
          </span>

          <p className="controlsTime">
            {Math.floor(videoTime / 60) +
              ":" +
              ("0" + Math.floor(videoTime % 60)).slice(-2)}
          </p>
        </div>
      </div>

      <div className="volumeControls">
        {sound ? (
          <button onClick={mute}>
            <img
              height={10}
              width={10}
              src="https://img.icons8.com/ios-filled/50/FFFFFF/medium-volume.png"
            />
          </button>
        ) : (
          <button onClick={unmute}>
            <img
              height={10}
              width={10}
              src="https://img.icons8.com/fluency-systems-filled/48/FFFFFF/no-audio.png"
            />
          </button>
        )}
      </div>
      <div className="volumeBar">
        <input
          className="slider"
          type="range"
          min="0"
          max="5"
          step="1"
          value={volume}
          onChange={volumeOnChange}
        />
      </div>
      <div className="fullScrn">
        <button onClick={onFullscreenChange} style={{ zIndex: "9999" }}>
          <img
            width={10}
            src="https://img.icons8.com/material-sharp/24/FFFFFF/full-screen--v1.png"
          />
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;
