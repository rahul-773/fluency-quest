import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Copy, LoaderCircle, Mic, MicOff, Phone, PhoneOff, Radio, UsersRound } from 'lucide-react';
import Peer, { type MediaConnection } from 'peerjs';

type CallStatus = 'idle' | 'creating' | 'waiting' | 'joining' | 'connected' | 'error';

const peerOptions = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:global.relay.metered.ca:80', username: 'fluencyquest', credential: 'change-me' },
      { urls: 'turn:global.relay.metered.ca:443', username: 'fluencyquest', credential: 'change-me' },
      { urls: 'turns:global.relay.metered.ca:443', username: 'fluencyquest', credential: 'change-me' },
    ],
    iceCandidatePoolSize: 0,
    iceTransportPolicy: 'all',
  },
};

export default function PeerPractice() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const generationRef = useRef(0);

  function closeResources() {
    generationRef.current += 1;
    callRef.current?.close();
    callRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setRoomCode('');
    setIsMuted(false);
  }

  useEffect(() => () => {
    generationRef.current += 1;
    callRef.current?.close();
    peerRef.current?.destroy();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const stream = localStreamRef.current;
    const canvas = localCanvasRef.current;
    if (!stream || !canvas) return;

    let animationFrame = 0;
    let audioContext: AudioContext | null = null;
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const context = canvas.getContext('2d');
      if (!context) return () => void audioContext?.close();

      const draw = () => {
        const width = canvas.clientWidth * (window.devicePixelRatio || 1);
        const height = canvas.clientHeight * (window.devicePixelRatio || 1);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        context.clearRect(0, 0, width, height);
        analyser.getByteFrequencyData(data);
        const barCount = 34;
        const gap = 3 * (window.devicePixelRatio || 1);
        const barWidth = (width - gap * (barCount - 1)) / barCount;
        for (let i = 0; i < barCount; i += 1) {
          const amplitude = data[Math.floor((i / barCount) * data.length)] / 255;
          const barHeight = Math.max(3, amplitude * height * 0.9);
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;
          context.fillStyle = `rgba(34, 211, 238, ${0.35 + amplitude * 0.65})`;
          context.beginPath();
          context.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          context.fill();
        }
        animationFrame = requestAnimationFrame(draw);
      };
      animationFrame = requestAnimationFrame(draw);
    } catch (error) {
      console.error('Unable to start the peer-call audio visualizer.', error);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (audioContext && audioContext.state !== 'closed') void audioContext.close();
    };
  }, [localStream]);

  function ensureSecureContext() {
    const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      throw new Error('Peer practice requires HTTPS. Use a secure host or localhost to access the microphone and live call signaling.');
    }
  }

  async function getMicrophoneStream() {
    ensureSecureContext();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Your browser does not support microphone access. Try a current version of Chrome, Edge, or Firefox.');
    }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  function attachCall(call: MediaConnection, generation: number) {
    if (callRef.current) {
      call.close();
      return;
    }
    callRef.current = call;
    call.on('stream', (remoteStream) => {
      if (generation !== generationRef.current) return;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        void remoteAudioRef.current.play().catch(() => {
          setErrorMessage('Your browser blocked remote audio. Use the audio player control to start playback.');
        });
      }
      setErrorMessage('');
      setStatus('connected');
    });
    call.on('close', () => {
      if (generation !== generationRef.current) return;
      callRef.current = null;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      setStatus(peerRef.current && !peerRef.current.destroyed ? 'waiting' : 'idle');
      setErrorMessage('The other person ended the call.');
    });
    call.on('error', (error) => {
      if (generation !== generationRef.current) return;
      setErrorMessage(`Call connection failed: ${error.message}`);
      setStatus('error');
    });

  }

  async function createRoom() {
    closeResources();
    setStatus('creating');
    setErrorMessage('');
    const generation = generationRef.current;
    try {
      const stream = await getMicrophoneStream();
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      const peer = new Peer(peerOptions);
      peerRef.current = peer;
      peer.on('open', (id) => {
        if (generation !== generationRef.current) return;
        setRoomCode(id);
        setStatus('waiting');
      });
      peer.on('call', (incomingCall) => {
        if (generation !== generationRef.current || callRef.current) {
          incomingCall.close();
          return;
        }
        incomingCall.answer(stream);
        attachCall(incomingCall, generation);
      });
      peer.on('disconnected', () => {
        if (generation !== generationRef.current) return;
        setErrorMessage('The peer signaling connection dropped. Try reopening the room.');
        setStatus('error');
      });
      peer.on('close', () => {
        if (generation !== generationRef.current) return;
        setErrorMessage('The peer connection closed. Please reopen the room and try again.');
        setStatus('idle');
      });
      peer.on('error', (error) => {
        if (generation !== generationRef.current) return;
        setErrorMessage(`Peer connection error: ${error.message}. Verify your TURN config and network connectivity.`);
        setStatus('error');
      });
    } catch (error) {
      if (generation !== generationRef.current) return;
      setErrorMessage(error instanceof Error ? error.message : 'Could not create a room.');
      setStatus('error');
      closeResources();
      setStatus('error');
    }
  }

  async function joinRoom() {
    const targetId = joinCode.trim();
    if (!targetId) {
      setErrorMessage('Enter the room code shared by the person hosting the call.');
      return;
    }
    closeResources();
    setStatus('joining');
    setErrorMessage('');
    const generation = generationRef.current;
    try {
      const stream = await getMicrophoneStream();
      if (generation !== generationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      const peer = new Peer(peerOptions);
      peerRef.current = peer;
      peer.on('open', () => {
        if (generation !== generationRef.current) return;
        const call = peer.call(targetId, stream);
        if (!call) {
          setErrorMessage('Could not start the call. Check the room code and try again.');
          setStatus('error');
          return;
        }
        attachCall(call, generation);
      });
      peer.on('disconnected', () => {
        if (generation !== generationRef.current) return;
        setErrorMessage('The call signaling server disconnected. Please retry the room connection.');
        setStatus('error');
      });
      peer.on('close', () => {
        if (generation !== generationRef.current) return;
        setErrorMessage('The peer connection closed. Please reopen the room and try again.');
        setStatus('idle');
      });
      peer.on('error', (error) => {
        if (generation !== generationRef.current) return;
        setErrorMessage(`Peer connection error: ${error.message}. Check the room code, network, and TURN configuration.`);
        setStatus('error');
      });
    } catch (error) {
      if (generation !== generationRef.current) return;
      setErrorMessage(error instanceof Error ? error.message : 'Could not join the room.');
      setStatus('error');
      closeResources();
      setStatus('error');
    }
  }

  function toggleMute() {
    const nextMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }

  function endCall() {
    closeResources();
    setStatus('idle');
    setErrorMessage('');
  }

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      setErrorMessage(`Could not copy the room code: ${error instanceof Error ? error.message : 'clipboard unavailable'}`);
    }
  }

  const isActive = status === 'creating' || status === 'waiting' || status === 'joining' || status === 'connected' || status === 'error' && localStream !== null;
  const statusLabel: Record<CallStatus, string> = {
    idle: 'Ready when you are',
    creating: 'Opening a private room…',
    waiting: 'Room is open · waiting for your partner',
    joining: 'Connecting to your partner…',
    connected: 'You’re live together',
    error: 'Connection needs attention',
  };

  return (
    <section className="panel relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative grid lg:grid-cols-[1fr_0.85fr]">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <UsersRound className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white">Peer Practice</h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Live audio
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
                Speak naturally with another learner. Create a room and share its code, or join a room they created.
              </p>
            </div>
          </div>

          {!isActive && (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                  <Radio className="h-4 w-4 text-cyan-300" /> Host a room
                </div>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">Start a room, then share your unique code with one partner.</p>
                <button
                  type="button"
                  onClick={createRoom}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/90 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  <Phone className="h-4 w-4" /> Create Room
                </button>
              </div>

              <form
                className="rounded-xl border border-slate-700 bg-slate-900/50 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void joinRoom();
                }}
              >
                <label htmlFor="peer-room-code" className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                  <UsersRound className="h-4 w-4 text-violet-300" /> Join a room
                </label>
                <p className="mb-3 text-xs leading-relaxed text-slate-400">Paste the code your partner shared with you.</p>
                <input
                  id="peer-room-code"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder="Room code"
                  autoComplete="off"
                  className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition hover:border-cyan-400/40 hover:bg-slate-700"
                >
                  <Phone className="h-4 w-4" /> Join Room
                </button>
              </form>
            </div>
          )}

          {isActive && (
            <div className="mt-7 rounded-xl border border-slate-700 bg-slate-950/40 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                {status === 'creating' || status === 'joining' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />
                ) : (
                  <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-amber-300 animate-pulse'}`} />
                )}
                {statusLabel[status]}
              </div>

              {roomCode && (
                <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Share this room code</div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all font-mono text-sm text-cyan-200">{roomCode}</code>
                    <button
                      type="button"
                      onClick={() => void copyRoomCode()}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                      aria-label="Copy room code"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {status === 'connected' && (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-3 text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                        <Mic className="h-5 w-5" />
                      </div>
                      <div className="text-xs font-bold text-white">You</div>
                      <div className="text-[10px] text-slate-500">{isMuted ? 'Microphone muted' : 'Microphone live'}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-3 text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 animate-pulse">
                        <UsersRound className="h-5 w-5" />
                      </div>
                      <div className="text-xs font-bold text-white">Your partner</div>
                      <div className="text-[10px] text-emerald-300">Connected</div>
                    </div>
                  </div>
                  <div className="mt-4 h-10 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/70 px-2">
                    <canvas ref={localCanvasRef} className="h-full w-full" aria-label="Microphone audio visualizer" />
                  </div>
                  <audio ref={remoteAudioRef} autoPlay playsInline controls className="mt-3 w-full accent-cyan-400" aria-label="Partner audio" />
                </>
              )}

              {status !== 'connected' && <p className="mt-4 text-xs text-slate-500">Keep this page open while your partner connects.</p>}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={!localStream}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${
                    isMuted ? 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25' : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={endCall}
                  className="flex items-center gap-2 rounded-xl bg-rose-600/90 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
                >
                  <PhoneOff className="h-4 w-4" /> End Call
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <aside className="border-t border-slate-800/80 bg-slate-950/25 p-5 sm:p-7 lg:border-l lg:border-t-0">
          <div className="font-display text-xs font-bold uppercase tracking-[0.18em] text-slate-500">How it works</div>
          <ol className="mt-4 space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-200">1</span>
              <div><div className="text-sm font-semibold text-slate-200">Start or join</div><p className="mt-0.5 text-xs leading-relaxed text-slate-500">Both learners need this page open in a modern browser.</p></div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-200">2</span>
              <div><div className="text-sm font-semibold text-slate-200">Allow microphone access</div><p className="mt-0.5 text-xs leading-relaxed text-slate-500">Your browser will ask before audio is shared. A secure HTTPS connection is required.</p></div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-200">3</span>
              <div><div className="text-sm font-semibold text-slate-200">Talk face-to-face, voice-to-voice</div><p className="mt-0.5 text-xs leading-relaxed text-slate-500">Audio travels peer-to-peer. The room code only helps the peers find each other.</p></div>
            </li>
          </ol>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-[11px] leading-relaxed text-slate-500">
            Connections use WebRTC with Google’s public STUN service. Some restrictive networks may prevent a direct connection.
          </div>
        </aside>
      </div>
    </section>
  );
}
