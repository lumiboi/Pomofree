import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './MusicPlayer.css';

const MusicPlayer = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState('jazz');
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customVideoTitle, setCustomVideoTitle] = useState('');
  const [trackDurations, setTrackDurations] = useState({});
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const playlists = {
    jazz: [
      {
        id: 1,
        title: "Jazz Track 1",
        artist: "Jazz Artist",
        url: "https://www.youtube.com/watch?v=MYPVQccHhAQ",
        duration: "0:00",
        youtubeId: "MYPVQccHhAQ"
      },
      {
        id: 2,
        title: "Jazz Track 2",
        artist: "Jazz Artist",
        url: "https://www.youtube.com/watch?v=qj9NFFvJ7o4",
        duration: "0:00",
        youtubeId: "qj9NFFvJ7o4"
      },
      {
        id: 3,
        title: "Jazz Track 3",
        artist: "Jazz Artist",
        url: "https://www.youtube.com/watch?v=-bBzIgIaPS4",
        duration: "0:00",
        youtubeId: "-bBzIgIaPS4"
      },
      {
        id: 4,
        title: "Jazz Track 4",
        artist: "Jazz Artist",
        url: "https://www.youtube.com/watch?v=zuIoQwq6y3c",
        duration: "0:00",
        youtubeId: "zuIoQwq6y3c"
      },
      {
        id: 5,
        title: "Jazz Track 5",
        artist: "Jazz Artist",
        url: "https://www.youtube.com/watch?v=nv_2rz5BFDA",
        duration: "0:00",
        youtubeId: "nv_2rz5BFDA"
      }
    ],
    lofi: [
      {
        id: 6,
        title: "Lofi Track 1",
        artist: "Lofi Artist",
        url: "https://www.youtube.com/watch?v=lTRiuFIWV54",
        duration: "0:00",
        youtubeId: "lTRiuFIWV54"
      },
      {
        id: 7,
        title: "Lofi Track 2",
        artist: "Lofi Artist",
        url: "https://www.youtube.com/watch?v=LAJH1x2Tm8c",
        duration: "0:00",
        youtubeId: "LAJH1x2Tm8c"
      },
      {
        id: 8,
        title: "Lofi Track 3",
        artist: "Lofi Artist",
        url: "https://www.youtube.com/watch?v=l-2hOKIrIyI",
        duration: "0:00",
        youtubeId: "l-2hOKIrIyI"
      },
      {
        id: 9,
        title: "Lofi Track 4",
        artist: "Lofi Artist",
        url: "https://www.youtube.com/watch?v=VDtjKuS2R3E",
        duration: "0:00",
        youtubeId: "VDtjKuS2R3E"
      }
    ],
    synthpop: [
      {
        id: 10,
        title: "Synthpop Track 1",
        artist: "Synthpop Artist",
        url: "https://www.youtube.com/watch?v=GSQ38qgrc_c",
        duration: "0:00",
        youtubeId: "GSQ38qgrc_c"
      },
      {
        id: 11,
        title: "Synthpop Track 2",
        artist: "Synthpop Artist",
        url: "https://www.youtube.com/watch?v=MxGJCjNa-80",
        duration: "0:00",
        youtubeId: "MxGJCjNa-80"
      },
      {
        id: 12,
        title: "Synthpop Track 3",
        artist: "Synthpop Artist",
        url: "https://www.youtube.com/watch?v=H1xXIgRUPGY",
        duration: "0:00",
        youtubeId: "H1xXIgRUPGY"
      },
      {
        id: 13,
        title: "Synthpop Track 4",
        artist: "Synthpop Artist",
        url: "https://www.youtube.com/watch?v=YuF711eHsrQ",
        duration: "0:00",
        youtubeId: "YuF711eHsrQ"
      },
      {
        id: 14,
        title: "Synthpop Track 5",
        artist: "Synthpop Artist",
        url: "https://www.youtube.com/watch?v=b1y93KhfpoU",
        duration: "0:00",
        youtubeId: "b1y93KhfpoU"
      }
    ]
  };

  const currentTracks = playlists[currentPlaylist];

  // YouTube API yükleme
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      const ytPlayer = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            event.target.setVolume(volume);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          },
          onDurationChange: (event) => {
            const videoDuration = event.target.getDuration();
            setDuration(videoDuration);
            
            // Eğer playlist'ten çalıyorsa, track süresini kaydet
            if (currentTrack >= 0 && currentTracks[currentTrack]) {
              const trackId = currentTracks[currentTrack].youtubeId;
              setTrackDurations(prev => ({
                ...prev,
                [trackId]: videoDuration
              }));
            }
          },
          onVideoDataChange: (event) => {
            if (event.target.getVideoData) {
              const videoData = event.target.getVideoData();
              if (videoData && videoData.title) {
                setCustomVideoTitle(videoData.title);
              }
            }
          },
          onError: (event) => {
            console.error('YouTube Player Error:', event.data);
          }
        }
      });
    };
  }, []);

  // YouTube URL'den video ID çıkarma
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Custom URL ile oynatma
  const handleCustomUrl = () => {
    const videoId = extractVideoId(customUrl);
    if (videoId && player) {
      player.loadVideoById(videoId);
      setCurrentTrack(-1);
      setTimeout(() => {
        player.playVideo();
      }, 1000);
    } else {
      alert('Geçerli bir YouTube URL\'si girin!');
    }
  };

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        if (currentTrack >= 0 && currentTracks[currentTrack]) {
          player.loadVideoById(currentTracks[currentTrack].youtubeId);
          setTimeout(() => {
            player.playVideo();
            // Süre bilgisini almaya zorla
            setTimeout(() => {
              const duration = player.getDuration();
              if (duration && duration > 0) {
                setDuration(duration);
                const trackId = currentTracks[currentTrack].youtubeId;
                setTrackDurations(prev => ({
                  ...prev,
                  [trackId]: duration
                }));
              }
            }, 2000);
          }, 1000);
        } else {
          player.playVideo();
        }
      }
    }
  };

  const handleNext = () => {
    if (currentTrack >= 0) {
      const nextTrack = (currentTrack + 1) % currentTracks.length;
      setCurrentTrack(nextTrack);
      setCurrentTime(0);
      if (player) {
        player.loadVideoById(currentTracks[nextTrack].youtubeId);
        setTimeout(() => {
          player.playVideo();
          // Süre bilgisini almaya zorla
          setTimeout(() => {
            const duration = player.getDuration();
            if (duration && duration > 0) {
              setDuration(duration);
              const trackId = currentTracks[nextTrack].youtubeId;
              setTrackDurations(prev => ({
                ...prev,
                [trackId]: duration
              }));
            }
          }, 2000);
        }, 1000);
      }
    }
  };

  const handlePrevious = () => {
    if (currentTrack >= 0) {
      const prevTrack = currentTrack === 0 ? currentTracks.length - 1 : currentTrack - 1;
      setCurrentTrack(prevTrack);
      setCurrentTime(0);
      if (player) {
        player.loadVideoById(currentTracks[prevTrack].youtubeId);
        setTimeout(() => {
          player.playVideo();
          // Süre bilgisini almaya zorla
          setTimeout(() => {
            const duration = player.getDuration();
            if (duration && duration > 0) {
              setDuration(duration);
              const trackId = currentTracks[prevTrack].youtubeId;
              setTrackDurations(prev => ({
                ...prev,
                [trackId]: duration
              }));
            }
          }, 2000);
        }, 1000);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  // İlerleme çubuğu için click handler
  const handleProgressClick = (e) => {
    if (player && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickTime = (clickX / width) * duration;
      
      player.seekTo(clickTime);
      setCurrentTime(clickTime);
    }
  };

  // Timer güncelleme
  useEffect(() => {
    let interval;
    if (player && isPlaying) {
      interval = setInterval(() => {
        if (player.getCurrentTime) {
          setCurrentTime(player.getCurrentTime());
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [player, isPlaying]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Sürükleme fonksiyonları
  const handleMouseDown = (e) => {
    if (e.target.closest('.header-controls')) return; // Butonlara tıklanırsa sürükleme
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // RequestAnimationFrame ile smooth hareket
    requestAnimationFrame(() => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Ekran sınırları içinde tut
      const maxX = window.innerWidth - 275;
      const maxY = window.innerHeight - (isMinimized ? 40 : 400);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse event'leri ekle
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!isVisible) return null;

  return (
    <div 
      className={`music-player ${isMinimized ? 'minimized' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="music-player-header">
        <div className="music-player-title">
          <span className="winamp-icon">♪</span>
          <span>{t('musicPlayer.title')}</span>
        </div>
                <div className="header-controls">
                  <button className="minimize-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? t('musicPlayer.restore') : t('musicPlayer.minimize')}>
                    {isMinimized ? '□' : '—'}
                  </button>
                  <button className="close-btn" onClick={() => setIsVisible(false)} title={t('musicPlayer.close')}>×</button>
                </div>
      </div>

      <div className="music-player-body" style={{ display: isMinimized ? 'none' : 'block' }}>
          <div className="playlist-selector">
            <select 
              value={currentPlaylist} 
              onChange={(e) => {
                setCurrentPlaylist(e.target.value);
                setCurrentTrack(0);
              }}
              className="playlist-dropdown"
            >
              <option value="jazz">Jazz</option>
              <option value="lofi">Lofi</option>
              <option value="synthpop">Synthpop</option>
            </select>
            <div style={{ display: 'flex', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder={t('musicPlayer.pasteUrl')}
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="custom-url-input"
                    />
                    <button
                      onClick={handleCustomUrl}
                      className="custom-url-button"
                    >
                      {t('musicPlayer.play')}
                    </button>
            </div>
          </div>

          <div className="track-info">
            <div className="track-title">
              {currentTrack >= 0 ? currentTracks[currentTrack]?.title : (customVideoTitle || 'Custom YouTube Video')}
            </div>
            <div className="track-artist">
              {currentTrack >= 0 ? currentTracks[currentTrack]?.artist : 'YouTube'}
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-time">{formatTime(currentTime)}</div>
            <div className="progress-track" onClick={handleProgressClick}>
              <div
                className="progress-fill"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              ></div>
            </div>
            <div className="progress-time">{formatTime(duration)}</div>
          </div>

            <div className="player-controls">
              <button className="control-btn" onClick={handlePrevious} title={t('musicPlayer.previous')}>◀◀</button>
              <button className="control-btn play-btn" onClick={handlePlayPause} title={isPlaying ? t('musicPlayer.pause') : t('musicPlayer.play')}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={handleNext} title={t('musicPlayer.next')}>▶▶</button>
            </div>

          <div className="volume-control">
            <span className="volume-icon">♪</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-value">{volume}%</span>
          </div>

          <div className="playlist">
            <div className="playlist-title">{t('musicPlayer.playlist')}</div>
            <div className="playlist-tracks">
              {currentTracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`playlist-track ${index === currentTrack ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTrack(index);
                    if (player) {
                      player.loadVideoById(track.youtubeId);
                      setTimeout(() => {
                        player.playVideo();
                        // Süre bilgisini almaya zorla
                        setTimeout(() => {
                          const duration = player.getDuration();
                          if (duration && duration > 0) {
                            setDuration(duration);
                            const trackId = track.youtubeId;
                            setTrackDurations(prev => ({
                              ...prev,
                              [trackId]: duration
                            }));
                          }
                        }, 2000);
                      }, 1000);
                    }
                  }}
                >
                  <span className="track-number">{index + 1}</span>
                  <span className="track-name">{track.title}</span>
                  <span className="track-duration">
                    {trackDurations[track.youtubeId] 
                      ? formatTime(trackDurations[track.youtubeId]) 
                      : '0:00'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      <div id="youtube-player" style={{ display: 'none' }}></div>
    </div>
  );
};

export default MusicPlayer;