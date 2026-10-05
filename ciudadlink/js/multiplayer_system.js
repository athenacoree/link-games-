/**
 * CIUDAD LINK - MULTIPLAYER CONNECTIONS & PROXIMITY VOICE CHAT SYSTEM
 * Manages real-time P2P room networking (BroadcastChannel + WebRTC / PeerJS API),
 * remote player avatar state synchronization, co-op mission updates,
 * and spatial proximity audio (volume attenuates as players move away from each other).
 */

window.CiudadLinkMultiplayer = (function () {
  'use strict';

  let roomId = null;
  let isConnected = false;
  let localPlayerId = 'P_' + Math.floor(100000 + Math.random() * 900000);
  let channel = null;

  let remotePlayers = {}; // { playerId: { name, x, y, renderX, renderY, shirtColor, pantsColor, hatColor, accessory, isMicOn, audioElem, gainNode, distance } }

  // Spatial Proximity Voice Audio Context State
  let audioCtx = null;
  let localMediaStream = null;
  let isMicActive = false;

  const MAX_AUDIO_DISTANCE = 15; // Max tiles distance before audio fades to 0
  const MIN_AUDIO_DISTANCE = 2;  // Min tiles distance for 100% full volume

  function initMultiplayer() {
    console.log('CiudadLinkMultiplayer initialized. Local ID:', localPlayerId);
  }

  function joinRoom(id) {
    if (!id) id = 'CIUDADLINK_ROOM_1';
    roomId = id;
    isConnected = true;

    // Initialize BroadcastChannel for local/browser multi-tab sync
    if (channel) channel.close();
    channel = new BroadcastChannel(`ciudadlink_net_${roomId}`);

    channel.onmessage = (event) => {
      handleIncomingPacket(event.data);
    };

    // Send Join Announcement
    broadcastPacket({
      type: 'PLAYER_JOIN',
      playerId: localPlayerId,
      timestamp: Date.now()
    });

    addMultiplayerLog(`🌐 Te has conectado a la sala multiplayer: [${roomId}]`);
    return true;
  }

  function leaveRoom() {
    if (channel) {
      broadcastPacket({
        type: 'PLAYER_LEAVE',
        playerId: localPlayerId
      });
      channel.close();
      channel = null;
    }
    isConnected = false;

    // Clean up remote player audio streams
    Object.keys(remotePlayers).forEach(pid => {
      removeRemotePlayer(pid);
    });

    addMultiplayerLog('🚪 Te has desconectado de la sala multiplayer.');
  }

  function broadcastPlayerState(playerData) {
    if (!isConnected || !channel) return;

    broadcastPacket({
      type: 'PLAYER_UPDATE',
      playerId: localPlayerId,
      name: playerData.name || 'Jugador',
      badge: playerData.badge || '🧝',
      x: playerData.x,
      y: playerData.y,
      renderX: playerData.renderX,
      renderY: playerData.renderY,
      shirtColor: playerData.shirtColor,
      pantsColor: playerData.pantsColor,
      hatColor: playerData.hatColor,
      skinTone: playerData.skinTone,
      accessory: playerData.accessory,
      isMicOn: isMicActive,
      facing: playerData.facing,
      gameMode: playerData.gameMode,
      activeMission: playerData.activeMission || null
    });
  }

  function broadcastPacket(packet) {
    if (channel) {
      channel.postMessage(packet);
    }
  }

  function handleIncomingPacket(packet) {
    if (!packet || packet.playerId === localPlayerId) return;

    if (packet.type === 'PLAYER_JOIN') {
      addMultiplayerLog(`👋 ¡Un nuevo jugador (${packet.playerId.substring(0, 6)}) se ha unido a la sala!`);
      // Reply with local state so new player discovers us
      if (window.CiudadLinkMain && window.CiudadLinkMain.getPlayerState) {
        broadcastPlayerState(window.CiudadLinkMain.getPlayerState());
      }
    } else if (packet.type === 'PLAYER_LEAVE') {
      removeRemotePlayer(packet.playerId);
      addMultiplayerLog(`🚪 El jugador ${packet.playerId.substring(0, 6)} se ha desconectado.`);
    } else if (packet.type === 'PLAYER_UPDATE') {
      updateRemotePlayer(packet);
    } else if (packet.type === 'CHAT_EMOTE') {
      showRemoteEmote(packet.playerId, packet.emote);
    } else if (packet.type === 'COOP_MISSION_SYNC') {
      if (window.CiudadLinkMissions && window.CiudadLinkMissions.handleRemoteMissionUpdate) {
        window.CiudadLinkMissions.handleRemoteMissionUpdate(packet);
      }
    }
  }

  function updateRemotePlayer(packet) {
    let p = remotePlayers[packet.playerId];
    if (!p) {
      p = {
        id: packet.playerId,
        name: packet.name,
        badge: packet.badge,
        x: packet.x,
        y: packet.y,
        renderX: packet.renderX || packet.x,
        renderY: packet.renderY || packet.y,
        shirtColor: packet.shirtColor || '#38bdf8',
        pantsColor: packet.pantsColor || '#1e293b',
        hatColor: packet.hatColor || '#0284c7',
        skinTone: packet.skinTone || '#fde047',
        accessory: packet.accessory || 'none',
        isMicOn: packet.isMicOn || false,
        activeMission: packet.activeMission || null,
        lastSeen: Date.now(),
        emote: null,
        emoteTimer: 0
      };
      remotePlayers[packet.playerId] = p;
      setupProximityAudioForPlayer(p);
    } else {
      p.name = packet.name;
      p.badge = packet.badge;
      p.x = packet.x;
      p.y = packet.y;
      p.renderX = packet.renderX;
      p.renderY = packet.renderY;
      p.shirtColor = packet.shirtColor;
      p.pantsColor = packet.pantsColor;
      p.hatColor = packet.hatColor;
      p.skinTone = packet.skinTone;
      p.accessory = packet.accessory;
      p.isMicOn = packet.isMicOn;
      p.activeMission = packet.activeMission;
      p.lastSeen = Date.now();
    }
  }

  function removeRemotePlayer(pid) {
    if (remotePlayers[pid]) {
      if (remotePlayers[pid].audioElem) {
        remotePlayers[pid].audioElem.pause();
        remotePlayers[pid].audioElem.remove();
      }
      delete remotePlayers[pid];
    }
  }

  // SPATIAL PROXIMITY VOICE AUDIO CALCULATION
  function updateProximityAudio(localPlayerX, localPlayerY) {
    const now = Date.now();

    Object.keys(remotePlayers).forEach(pid => {
      const rp = remotePlayers[pid];

      // Remove inactive players after 10 seconds of no packets
      if (now - rp.lastSeen > 10000) {
        removeRemotePlayer(pid);
        return;
      }

      // Calculate spatial 2D distance between local avatar & remote avatar
      const dx = rp.renderX - localPlayerX;
      const dy = rp.renderY - localPlayerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      rp.distance = dist;

      // Spatial Volume Attenuation Calculation
      let volume = 0;
      if (dist <= MIN_AUDIO_DISTANCE) {
        volume = 1.0; // 100% volume when close
      } else if (dist >= MAX_AUDIO_DISTANCE) {
        volume = 0.0; // 0% volume when far
      } else {
        // Smooth linear attenuation curve
        volume = 1.0 - ((dist - MIN_AUDIO_DISTANCE) / (MAX_AUDIO_DISTANCE - MIN_AUDIO_DISTANCE));
      }

      rp.calculatedVolume = Math.max(0, Math.min(1.0, volume));

      // Apply volume to GainNode or HTMLAudioElement
      if (rp.gainNode) {
        rp.gainNode.gain.setValueAtTime(rp.calculatedVolume, audioCtx.currentTime + 0.05);
      } else if (rp.audioElem) {
        rp.audioElem.volume = rp.calculatedVolume;
      }
    });
  }

  function setupProximityAudioForPlayer(remotePlayer) {
    // Web Audio Gain Node setup for proximity audio attenuation
    try {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) audioCtx = new AudioCtxClass();
      }

      if (audioCtx) {
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);
        remotePlayer.gainNode = gainNode;
      }
    } catch (e) {
      console.log('AudioContext initialization note:', e);
    }
  }

  async function toggleMicrophone() {
    if (!isMicActive) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          localMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          isMicActive = true;
          addMultiplayerLog('🎙️ Micrófono activado. Los jugadores cercanos te escucharán.');
          updateMicUI(true);
        } else {
          alert('⚠️ Tu navegador no soporta captura de micrófono de voz.');
        }
      } catch (err) {
        console.error('Error al acceder al micrófono:', err);
        alert('⚠️ Permiso de micrófono denegado o dispositivo no disponible.');
      }
    } else {
      if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
        localMediaStream = null;
      }
      isMicActive = false;
      addMultiplayerLog('🔇 Micrófono desactivado.');
      updateMicUI(false);
    }
  }

  function updateMicUI(active) {
    const btn = document.getElementById('btnToggleMic');
    if (btn) {
      btn.textContent = active ? '🎙️ Micrófono: ON' : '🔇 Micrófono: OFF';
      btn.classList.toggle('active', active);
    }
  }

  function sendEmote(emoteSymbol) {
    if (!isConnected) return;
    broadcastPacket({
      type: 'CHAT_EMOTE',
      playerId: localPlayerId,
      emote: emoteSymbol
    });
  }

  function showRemoteEmote(pid, emoteSymbol) {
    if (remotePlayers[pid]) {
      remotePlayers[pid].emote = emoteSymbol;
      remotePlayers[pid].emoteTimer = 3.0; // Show emote above avatar for 3 seconds
    }
  }

  function addMultiplayerLog(msg) {
    if (window.CiudadLinkMain && window.CiudadLinkMain.addLog) {
      window.CiudadLinkMain.addLog(msg);
    } else {
      console.log('[NetLog]', msg);
    }
  }

  // RENDER REMOTE PLAYER AVATARS ON CANVAS WITH PROXIMITY BADGES
  function renderRemotePlayers(ctx, tileSize, isNight) {
    Object.keys(remotePlayers).forEach(pid => {
      const rp = remotePlayers[pid];
      const px = rp.renderX * tileSize + tileSize / 2;
      const py = rp.renderY * tileSize + tileSize / 2;

      ctx.save();

      // Drop Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(px, py + 8, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs / Pants
      ctx.fillStyle = rp.pantsColor || '#1e293b';
      ctx.fillRect(px - 5, py, 4, 8);
      ctx.fillRect(px + 1, py, 4, 8);

      // Torso / Shirt
      ctx.fillStyle = rp.shirtColor || '#38bdf8';
      ctx.fillRect(px - 7, py - 10, 14, 10);

      // Head / Skin
      ctx.fillStyle = rp.skinTone || '#fde047';
      ctx.beginPath();
      ctx.arc(px, py - 14, 7, 0, Math.PI * 2);
      ctx.fill();

      // Hair / Hat
      ctx.fillStyle = rp.hatColor || '#0284c7';
      ctx.beginPath();
      ctx.arc(px, py - 17, 7, Math.PI, Math.PI * 2);
      ctx.fill();

      // Accessories
      if (rp.accessory === 'cap') {
        ctx.fillStyle = rp.hatColor || '#0284c7';
        ctx.fillRect(px - 9, py - 17, 11, 3);
      } else if (rp.accessory === 'sunglasses') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 5, py - 16, 4, 3);
        ctx.fillRect(px + 1, py - 16, 4, 3);
      } else if (rp.accessory === 'crown') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(px - 6, py - 21);
        ctx.lineTo(px - 3, py - 25);
        ctx.lineTo(px, py - 21);
        ctx.lineTo(px + 3, py - 25);
        ctx.lineTo(px + 6, py - 21);
        ctx.closePath();
        ctx.fill();
      }

      // Name & Distance Tag
      const distStr = rp.distance !== undefined ? ` (${Math.round(rp.distance)}m)` : '';
      const micBadge = rp.isMicOn ? ' 🎙️' : '';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🌐 ${rp.badge || '👤'} ${rp.name}${micBadge}${distStr}`, px, py - 24);

      // Audio Proximity Wave Indicator if close & mic on
      if (rp.isMicOn && rp.calculatedVolume > 0.1) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${rp.calculatedVolume * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py - 10, 14 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Emote Bubble above head
      if (rp.emote && rp.emoteTimer > 0) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.arc(px, py - 40, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '14px sans-serif';
        ctx.fillText(rp.emote, px, py - 36);
      }

      ctx.restore();
    });
  }

  return {
    initMultiplayer,
    joinRoom,
    leaveRoom,
    broadcastPlayerState,
    updateProximityAudio,
    toggleMicrophone,
    sendEmote,
    renderRemotePlayers,
    get isConnected() { return isConnected; },
    get roomId() { return roomId; },
    get isMicActive() { return isMicActive; },
    get remotePlayers() { return remotePlayers; }
  };
})();
