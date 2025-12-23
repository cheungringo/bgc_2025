import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Play, RotateCcw, Users, Target, Plus, Minus, Trash2, Download, Upload, Zap, ChevronDown, ChevronUp, Maximize2, X } from 'lucide-react';

// Participant row component with dropdown
const ParticipantRow = ({ teamId, pId, participant, isExpanded, onToggle, onNameChange, onStatChange, labels }) => {
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    if (isExpanded && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      dropdownRef.current.style.left = `${buttonRect.right + 4}px`;
      dropdownRef.current.style.top = `${buttonRect.top}px`;
    }
  }, [isExpanded]);
  
  return (
    <div className="mb-0.5" style={{ position: 'relative' }}>
      <div className="p-0.5 bg-gray-800 rounded border border-gray-600 flex items-center gap-0.5" style={{ position: 'relative', zIndex: isExpanded ? 2 : 1 }}>
        <input
          type="text"
          value={participant.name}
          onChange={(e) => onNameChange(teamId, pId, e.target.value)}
          className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded px-0.5 py-0"
          style={{ fontSize: '7px' }}
        />
        <button
          ref={buttonRef}
          onClick={onToggle}
          className="text-gray-300 hover:text-gray-100 px-0 py-0 rounded hover:bg-gray-600 flex-shrink-0"
          title={isExpanded ? "Hide stats" : "Show stats"}
          style={{ fontSize: '8px' }}
        >
          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      {isExpanded && createPortal(
        <div 
          ref={dropdownRef}
          className="bg-gray-700 border border-gray-600 rounded p-0.5 shadow-lg"
          style={{ 
            position: 'fixed',
            zIndex: 10000,
            minWidth: '120px',
            fontSize: '8px',
            pointerEvents: 'auto'
          }}
        >
          {labels.map((label, statIndex) => (
            <div key={statIndex} className="flex items-center justify-between mb-0.5">
              <span className="text-gray-300" style={{ fontSize: '8px', minWidth: '40px' }}>{label}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onStatChange(teamId, pId, statIndex, -1)}
                  className="bg-red-900 text-red-200 px-0.5 py-0 rounded hover:bg-red-800"
                  style={{ fontSize: '8px' }}
                >
                  <Minus size={8} />
                </button>
                <span className="font-semibold text-gray-100 w-5 text-center" style={{ fontSize: '9px' }}>
                  {participant.stats[statIndex]}
                </span>
                <button
                  onClick={() => onStatChange(teamId, pId, statIndex, 1)}
                  className="bg-green-900 text-green-200 px-0.5 py-0 rounded hover:bg-green-800"
                  style={{ fontSize: '8px' }}
                >
                  <Plus size={8} />
                </button>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const RadarMissionAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const [labels, setLabels] = useState(['Stat A', 'Stat B', 'Stat C', 'Stat D', 'Stat E', 'Stat F']);
  const [pageTitle, setPageTitle] = useState('Mission Control');
  
  // Missions state (now dynamic)
  const [missions, setMissions] = useState({
    alpha: { name: "Mission Alpha", stats: [6, 8, 4, 9, 6, 7], photoPath: "/photos/photo_a.jpg" },
    beta: { name: "Mission Beta", stats: [7, 5, 8, 6, 7, 5], photoPath: "/photos/photo_b.jpg" },
    gamma: { name: "Mission Gamma", stats: [5, 9, 6, 7, 5, 8], photoPath: "/photos/photo_c.jpg" },
    delta: { name: "Mission Delta", stats: [8, 6, 7, 8, 9, 6], photoPath: "/photos/photo_d.jpg" }
  });
  
  // Current selections
  const [currentMissionId, setCurrentMissionId] = useState('alpha');
  const [selectedIndividualIds, setSelectedIndividualIds] = useState(['p1', 'p2']); // Array of participant IDs
  const [selectedModifierIds, setSelectedModifierIds] = useState([]); // Array of modifier IDs
  
  // Predefined modifiers: { id: { name, description, missionEffect: [delta per stat], participantEffect: [delta per stat] } }
  const [modifiers, setModifiers] = useState({
    modA: { 
      name: "Modifier A", 
      description: "All mission stats -2",
      missionEffect: [-2, -2, -2, -2, -2, -2],
      participantEffect: [0, 0, 0, 0, 0, 0]
    },
    modB: { 
      name: "Modifier B", 
      description: "All participant stats +2",
      missionEffect: [0, 0, 0, 0, 0, 0],
      participantEffect: [2, 2, 2, 2, 2, 2]
    },
    modC: { 
      name: "Modifier C", 
      description: "Mission stats -1, Participant stats +1",
      missionEffect: [-1, -1, -1, -1, -1, -1],
      participantEffect: [1, 1, 1, 1, 1, 1]
    },
    modD: { 
      name: "Modifier D", 
      description: "Mission stats +1, Participant stats -1",
      missionEffect: [1, 1, 1, 1, 1, 1],
      participantEffect: [-1, -1, -1, -1, -1, -1]
    },
    modE: { 
      name: "Modifier E", 
      description: "First 3 mission stats -2",
      missionEffect: [-2, -2, -2, 0, 0, 0],
      participantEffect: [0, 0, 0, 0, 0, 0]
    },
    modF: { 
      name: "Modifier F", 
      description: "Last 3 participant stats +2",
      missionEffect: [0, 0, 0, 0, 0, 0],
      participantEffect: [0, 0, 0, 2, 2, 2]
    }
  });
  
  // Teams data structure: { teamId: { name, score, participants: { participantId: { name, stats: [] } } } }
  const [teams, setTeams] = useState({
    team1: {
      name: "Team 1",
      score: 0,
      participants: {
        p1: { name: "Player 1", stats: [3, 3, 3, 3, 3, 3] },
        p2: { name: "Player 2", stats: [2, 2, 2, 2, 2, 2] },
        p3: { name: "Player 3", stats: [4, 3, 4, 3, 4, 3] },
        p4: { name: "Player 4", stats: [1, 2, 2, 2, 1, 2] }
      }
    },
    team2: {
      name: "Team 2",
      score: 0,
      participants: {
        p5: { name: "Player 5", stats: [3, 4, 3, 3, 3, 3] },
        p6: { name: "Player 6", stats: [2, 1, 2, 1, 2, 1] },
        p7: { name: "Player 7", stats: [4, 4, 4, 4, 4, 4] },
        p8: { name: "Player 8", stats: [2, 2, 3, 2, 2, 3] }
      }
    },
    team3: {
      name: "Team 3",
      score: 0,
      participants: {
        p9: { name: "Player 9", stats: [3, 3, 2, 3, 3, 2] },
        p10: { name: "Player 10", stats: [1, 2, 1, 2, 1, 2] },
        p11: { name: "Player 11", stats: [4, 5, 4, 5, 4, 5] },
        p12: { name: "Player 12", stats: [2, 2, 2, 2, 2, 2] }
      }
    },
    team4: {
      name: "Team 4",
      score: 0,
      participants: {
        p13: { name: "Player 13", stats: [3, 2, 3, 2, 3, 2] },
        p14: { name: "Player 14", stats: [2, 3, 2, 3, 2, 3] },
        p15: { name: "Player 15", stats: [4, 4, 3, 4, 3, 4] },
        p16: { name: "Player 16", stats: [1, 1, 2, 1, 2, 1] }
      }
    }
  });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
  const [animationTime, setAnimationTime] = useState(0);
  const [result, setResult] = useState(null);
  const [showMissionPolygon, setShowMissionPolygon] = useState(true);
  const [showTeamPolygon, setShowTeamPolygon] = useState(true);
  const [expandedParticipants, setExpandedParticipants] = useState(new Set()); // Track which participants have stats expanded
  const [editingTeams, setEditingTeams] = useState(new Set()); // Track which teams are being edited
  const [photoError, setPhotoError] = useState(false); // Track photo loading errors
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState(false); // Track fullscreen photo state
  const [showPhotoOnRight, setShowPhotoOnRight] = useState(false); // Track right-side photo display
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const ANIMATION_DURATION = 3000;
  const INITIAL_SPEED = 15;
  const MAX_STAT_VALUE = 10;
  const CENTER_X = 250;
  const CENTER_Y = 250;
  const MAX_RADIUS = 200;
  const BALL_RADIUS = 8;
  
  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Play success sound
  const playSuccessSound = async () => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    
    // Resume audio context if suspended (required for browser autoplay policies)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 523.25; // C5 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Play a second note for a more pleasant success sound
    setTimeout(async () => {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      oscillator2.frequency.value = 659.25; // E5 note
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator2.start(ctx.currentTime);
      oscillator2.stop(ctx.currentTime + 0.5);
    }, 100);
  };
  
  // Play failure sound
  const playFailureSound = async () => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    
    // Resume audio context if suspended (required for browser autoplay policies)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 220; // A3 note - lower, more somber
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    // Slide down in frequency for a "fail" effect
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.8);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  };
  
  // Get current mission stats with modifiers applied
  const getCurrentMissionStats = () => {
    const baseStats = missions[currentMissionId].stats;
    let modifiedStats = [...baseStats];
    
    // Apply all selected modifiers' mission effects
    selectedModifierIds.forEach(modifierId => {
      if (modifiers[modifierId] && modifiers[modifierId].missionEffect) {
        modifiedStats = modifiedStats.map((stat, i) => {
          const newValue = stat + (modifiers[modifierId].missionEffect[i] || 0);
          return Math.max(0, Math.min(MAX_STAT_VALUE, newValue));
        });
      }
    });
    
    return modifiedStats;
  };
  
  // Get all individuals from all teams with their team info
  const getAllIndividuals = () => {
    const individuals = [];
    Object.entries(teams).forEach(([teamId, team]) => {
      Object.entries(team.participants).forEach(([participantId, participant]) => {
        individuals.push({
          id: participantId,
          teamId,
          teamName: team.name,
          name: participant.name,
          stats: participant.stats
        });
      });
    });
    return individuals;
  };
  
  // Get team color based on selected players
  // Team 1: p1-p4, Team 2: p5-p8, Team 3: p9-p12, Team 4: p13-p16
  const getTeamColorForSelectedPlayers = () => {
    if (!selectedIndividualIds || selectedIndividualIds.length === 0) {
      return '#E74C3C'; // Default red
    }
    
    // Check which team the selected players belong to
    const selectedTeamIds = new Set();
    selectedIndividualIds.forEach(participantId => {
      Object.entries(teams).forEach(([teamId, team]) => {
        if (team.participants[participantId]) {
          selectedTeamIds.add(teamId);
        }
      });
    });
    
    // If all selected players are from the same team, use that team's color
    if (selectedTeamIds.size === 1) {
      const teamId = Array.from(selectedTeamIds)[0];
      return teamColors[teamId] || '#E74C3C';
    }
    
    // If multiple teams selected, use default red
    return '#E74C3C';
  };

  // Calculate total stats from selected individuals (sum of all selected participants) with modifiers applied
  const getSelectedIndividualsTotalStats = () => {
    if (!selectedIndividualIds || selectedIndividualIds.length === 0) {
      return [0, 0, 0, 0, 0, 0];
    }
    
    const totals = [0, 0, 0, 0, 0, 0];
    selectedIndividualIds.forEach(participantId => {
      // Find the participant in teams
      Object.values(teams).forEach(team => {
        if (team.participants[participantId]) {
          team.participants[participantId].stats.forEach((stat, i) => {
            totals[i] += stat;
          });
        }
      });
    });
    
    // Apply modifiers' participant effects
    let modifiedTotals = totals.map(total => Math.min(total, MAX_STAT_VALUE));
    selectedModifierIds.forEach(modifierId => {
      if (modifiers[modifierId] && modifiers[modifierId].participantEffect) {
        modifiedTotals = modifiedTotals.map((stat, i) => {
          const newValue = stat + (modifiers[modifierId].participantEffect[i] || 0);
          return Math.max(0, Math.min(MAX_STAT_VALUE, newValue));
        });
      }
    });
    
    return modifiedTotals;
  };
  
  const polarToCartesian = (angle, radius) => {
    const x = CENTER_X + radius * Math.cos(angle - Math.PI / 2);
    const y = CENTER_Y + radius * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };
  
  const getPolygonPoints = (data) => {
    return data.map((value, i) => {
      const angle = (Math.PI * 2 * i) / data.length;
      const radius = (value / MAX_STAT_VALUE) * MAX_RADIUS;
      return polarToCartesian(angle, radius);
    });
  };
  
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const getRandomPointInPolygon = (polygon) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    polygon.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    let attempts = 0;
    while (attempts < 1000) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      if (isPointInPolygon({ x, y }, polygon)) {
        return { x, y };
      }
      attempts++;
    }
    return { x: CENTER_X, y: CENTER_Y };
  };
  
  // Calculate polygon area using the shoelace formula
  const calculatePolygonArea = (polygon) => {
    if (polygon.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }
    return Math.abs(area) / 2;
  };
  
  // Calculate intersection area using Monte Carlo method
  const calculateIntersectionArea = (polygon1, polygon2, sampleCount = 100000) => {
    // Get bounding box of both polygons
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    [...polygon1, ...polygon2].forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    const boundingBoxArea = (maxX - minX) * (maxY - minY);
    let pointsInBoth = 0;
    
    for (let i = 0; i < sampleCount; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      
      if (isPointInPolygon({ x, y }, polygon1) && isPointInPolygon({ x, y }, polygon2)) {
        pointsInBoth++;
      }

    }
    
    return (pointsInBoth / sampleCount) * boundingBoxArea;
  };
  
  // Calculate overlap percentage: intersection area / blue polygon area * 100
  const calculateOverlapPercentage = (bluePolygon, redPolygon) => {
    const intersectionArea = calculateIntersectionArea(bluePolygon, redPolygon);
    const blueArea = calculatePolygonArea(bluePolygon);
    
    if (blueArea === 0) return 0;
    
    return (intersectionArea / blueArea) * 100;
  };
  
  // Draw checkmark on canvas
  const drawCheckmark = (ctx, x, y, size) => {
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = '#22c55e';
    ctx.lineWidth = size / 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const radius = size / 2;
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Draw circle background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = size / 12;
    ctx.stroke();
    
    // Draw checkmark
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.3, centerY);
    ctx.lineTo(centerX - radius * 0.05, centerY + radius * 0.35);
    ctx.lineTo(centerX + radius * 0.4, centerY - radius * 0.3);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = size / 8;
    ctx.stroke();
  };
  
  // Draw X on canvas
  const drawX = (ctx, x, y, size) => {
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = size / 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const radius = size / 2;
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Draw circle background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = size / 12;
    ctx.stroke();
    
    // Draw X
    const offset = radius * 0.4;
    ctx.beginPath();
    ctx.moveTo(centerX - offset, centerY - offset);
    ctx.lineTo(centerX + offset, centerY + offset);
    ctx.moveTo(centerX + offset, centerY - offset);
    ctx.lineTo(centerX - offset, centerY + offset);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = size / 8;
    ctx.stroke();
  };
  
  const drawRadarChart = (ctx, currentBallPos = null) => {
    ctx.clearRect(0, 0, 500, 500);
    
    // Draw concentric circles
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(CENTER_X, CENTER_Y, (MAX_RADIUS / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw axis lines and labels
    ctx.strokeStyle = '#d0d0d0';
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    labels.forEach((label, i) => {
      const angle = (Math.PI * 2 * i) / labels.length;
      const end = polarToCartesian(angle, MAX_RADIUS);
      
      ctx.beginPath();
      ctx.moveTo(CENTER_X, CENTER_Y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      const labelPos = polarToCartesian(angle, MAX_RADIUS + 30);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(label, labelPos.x, labelPos.y);
      ctx.fillText(label, labelPos.x, labelPos.y);
      
      for (let j = 2; j <= 10; j += 2) {
        const scalePos = polarToCartesian(angle, (j / MAX_STAT_VALUE) * MAX_RADIUS);
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.fillText(j.toString(), scalePos.x + 10, scalePos.y);
      }
    });
    
    // Draw mission polygon (pale white/grey) - only if enabled
    if (showMissionPolygon) {
      const missionPoints = getPolygonPoints(getCurrentMissionStats());
      ctx.beginPath();
      ctx.strokeStyle = '#D1D5DB'; // Pale grey
      ctx.fillStyle = 'rgba(209, 213, 219, 0.2)'; // Pale grey with transparency
      ctx.lineWidth = 3;
      missionPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    // Draw selected individuals polygon (team color dashed) - only if enabled
    if (showTeamPolygon) {
      const selectedIndividualsPoints = getPolygonPoints(getSelectedIndividualsTotalStats());
      const teamColor = getTeamColorForSelectedPlayers();
      // Convert hex to rgba for fill
      const r = parseInt(teamColor.slice(1, 3), 16);
      const g = parseInt(teamColor.slice(3, 5), 16);
      const b = parseInt(teamColor.slice(5, 7), 16);
      ctx.beginPath();
      ctx.strokeStyle = teamColor;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      selectedIndividualsPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw ball
    const ballPos = currentBallPos || ballPosition;
    if ((isAnimating || result !== null) && (ballPos.x !== 0 || ballPos.y !== 0)) {
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = result === 'pass' ? '#27AE60' : result === 'fail' ? '#E74C3C' : '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw result icon (checkmark or X) in top left
    if (result) {
      const iconSize = 80;
      const iconX = 20;
      const iconY = 20;
      
      if (result === 'pass') {
        drawCheckmark(ctx, iconX, iconY, iconSize);
      } else {
        drawX(ctx, iconX, iconY, iconSize);
      }
    }
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (!isAnimating) {
      drawRadarChart(ctx);
      return;
    }
    
    let startTime = null;
    let currentBallPos = { ...ballPosition };
    let currentBallVel = { ...ballVelocity };
    let lastTimeUpdate = 0;
    const TIME_UPDATE_INTERVAL = 100; // Update time display every 100ms instead of every frame
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Throttle animation time updates to reduce React re-renders
      if (elapsed - lastTimeUpdate >= TIME_UPDATE_INTERVAL) {
        setAnimationTime(elapsed);
        lastTimeUpdate = elapsed;
      }
      
      if (elapsed >= ANIMATION_DURATION) {
        setIsAnimating(false);
        setBallPosition(currentBallPos);
        setAnimationTime(ANIMATION_DURATION);
        
        const selectedIndividualsPoints = getPolygonPoints(getSelectedIndividualsTotalStats());
        const isInside = isPointInPolygon(currentBallPos, selectedIndividualsPoints);
        const newResult = isInside ? 'pass' : 'fail';
        setResult(newResult);
        
        // Play sound based on result
        if (newResult === 'pass') {
          playSuccessSound();
        } else {
          playFailureSound();
        }
        
        drawRadarChart(ctx, currentBallPos);
        return;
      }
      
      // Get the polygon vertices representing the mission boundary for collision detection
      const missionPoints = getPolygonPoints(getCurrentMissionStats());
      
      // PHYSICS: Apply deceleration based on elapsed time (linear from 1.0 to 0.0)
      // As the animation progresses, the deceleration factor decreases linearly from 1.0 (full speed at start)
      // to 0.0 (stopped at end), creating a smooth slowdown effect
      const decelerationFactor = 1 - (elapsed / ANIMATION_DURATION);
      
      // Apply the deceleration factor to the base velocity components
      // This scales down the velocity proportionally to how much time has elapsed
      const deceleratedVelX = currentBallVel.x * decelerationFactor;
      const deceleratedVelY = currentBallVel.y * decelerationFactor;
      
      // KINEMATICS: Calculate the new position using the decelerated velocity
      // Position = old position + (velocity * time), where time is implicitly 1 frame
      // This moves the ball in the direction of its velocity vector
      let newX = currentBallPos.x + deceleratedVelX;
      let newY = currentBallPos.y + deceleratedVelY;
      
      // COLLISION DETECTION: Check collision with each edge of the polygon boundary
      // Iterate through all edges of the polygon (connecting each vertex to the next)
      for (let i = 0; i < missionPoints.length; i++) {
        // Get the two vertices that define the current edge
        const p1 = missionPoints[i];
        const p2 = missionPoints[(i + 1) % missionPoints.length]; // Wrap around to first vertex for last edge
        
        // Calculate the edge vector (direction from p1 to p2)
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        
        // Calculate the length of the edge vector using Pythagorean theorem
        const len = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate the normalized normal vector (perpendicular to the edge, pointing outward)
        // The normal is perpendicular to the edge: rotate edge vector 90° counterclockwise
        // Normalized means it has length 1, making it a unit vector for direction calculations
        const nx = -dy / len; // Negative y-component gives outward normal
        const ny = dx / len;  // Positive x-component gives outward normal
        
        // Calculate the vector from edge start point (p1) to the ball's new position
        const toBallX = newX - p1.x;
        const toBallY = newY - p1.y;
        
        // Calculate the signed distance from the ball to the edge using dot product projection
        // This tells us how far the ball is from the edge line (positive = outside, negative = inside)
        // The dot product projects the ball position onto the normal vector
        const dist = toBallX * nx + toBallY * ny;
        
        // COLLISION CHECK: If the ball is within one radius distance of the edge
        // (meaning the ball's edge would intersect the boundary line)
        if (Math.abs(dist) < BALL_RADIUS) {
          // Calculate the dot product of velocity and normal to determine approach direction
          // Negative dot product means the ball is moving toward the edge (approaching)
          const dot = deceleratedVelX * nx + deceleratedVelY * ny;
          
          // Only reflect if the ball is moving toward the edge (not away from it)
          if (dot < 0) {
            // PHYSICS: Reflect the decelerated velocity vector off the edge
            // Reflection formula: v_reflected = v - 2(v·n)n
            // This reverses the component of velocity perpendicular to the surface
            // while preserving the component parallel to the surface
            const reflectedVelX = deceleratedVelX - 2 * dot * nx;
            const reflectedVelY = deceleratedVelY - 2 * dot * ny;
            
            // Update the base velocity by scaling the reflected velocity back up
            // This maintains the deceleration effect after the bounce, so the ball
            // continues to slow down even after collisions
            currentBallVel.x = reflectedVelX / decelerationFactor;
            currentBallVel.y = reflectedVelY / decelerationFactor;
            
            // POSITION CORRECTION: Push the ball out of the boundary to prevent overlap
            // Move the ball along the normal vector by the penetration distance
            // This ensures the ball's edge touches the boundary line, not its center
            newX += nx * (BALL_RADIUS - dist);
            newY += ny * (BALL_RADIUS - dist);
          }
        }
      }
      
      currentBallPos = { x: newX, y: newY };
      drawRadarChart(ctx, currentBallPos);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, currentMissionId, selectedIndividualIds, selectedModifierIds, teams, missions, showMissionPolygon, showTeamPolygon, labels]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawRadarChart(ctx);
    }
  }, [currentMissionId, selectedIndividualIds, selectedModifierIds, teams, missions, showMissionPolygon, showTeamPolygon, labels]);

  // Reset photo error when mission changes
  useEffect(() => {
    setPhotoError(false);
  }, [currentMissionId]);
  
  const startAnimation = () => {
    // Only start if both polygons are visible
    if (!showMissionPolygon || !showTeamPolygon) return;
    
    const missionPoints = getPolygonPoints(getCurrentMissionStats());
    const startPos = getRandomPointInPolygon(missionPoints);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = INITIAL_SPEED;
    
    setBallPosition(startPos);
    setBallVelocity({ x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
    setIsAnimating(true);
    setResult(null);
    setAnimationTime(0);
  };   
  
  const _resetAnimation = () => {
    setIsAnimating(false);
    setResult(null);
    setAnimationTime(0);
    setBallPosition({ x: CENTER_X, y: CENTER_Y });
    setBallVelocity({ x: 0, y: 0 });
  };
  
  const updateParticipantStat = (teamId, participantId, statIndex, delta) => {
    setTeams(prev => {
      const newTeams = { ...prev };
      const newTeam = { ...newTeams[teamId] };
      const newParticipants = { ...newTeam.participants };
      const newParticipant = { ...newParticipants[participantId] };
      const newStats = [...newParticipant.stats];
      const currentValue = newStats[statIndex];
      const newValue = Math.max(0, Math.min(10, currentValue + delta));
      newStats[statIndex] = newValue;
      newParticipant.stats = newStats;
      newParticipants[participantId] = newParticipant;
      newTeam.participants = newParticipants;
      newTeams[teamId] = newTeam;
      return newTeams;
    });
  };
  
  const toggleIndividualSelection = (participantId) => {
    setSelectedIndividualIds(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        return [...prev, participantId];
      }
    });
  };
  
  const addParticipant = (teamId) => {
    const newId = `p${Date.now()}`;
    setTeams(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        participants: {
          ...prev[teamId].participants,
          [newId]: { name: `Participant ${Object.keys(prev[teamId].participants).length + 1}`, stats: Array(labels.length).fill(0) }
        }
      }
    }));
  };
  
  const removeParticipant = (teamId, participantId) => {
    setTeams(prev => {
      const newTeams = { ...prev };
      delete newTeams[teamId].participants[participantId];
      return newTeams;
    });
    // Remove from selection if it was selected
    setSelectedIndividualIds(prev => prev.filter(id => id !== participantId));
  };
  
  const addTeam = () => {
    const newId = `team${Date.now()}`;
    const newParticipantId = `p${Date.now()}`;
    setTeams(prev => ({
      ...prev,
      [newId]: {
        name: `Team ${Object.keys(prev).length + 1}`,
        score: 0,
        participants: {
          [newParticipantId]: { name: "Member 1", stats: Array(labels.length).fill(0) }
        }
      }
    }));
    // Auto-select the new participant
    setSelectedIndividualIds(prev => [...prev, newParticipantId]);
  };
  
  const updateParticipantName = (teamId, participantId, name) => {
    setTeams(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        participants: {
          ...prev[teamId].participants,
          [participantId]: { ...prev[teamId].participants[participantId], name }
        }
      }
    }));
  };
  
  const updateTeamName = (teamId, name) => {
    setTeams(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], name }
    }));
  };
  
  const updateTeamScore = (teamId, score) => {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return;
    setTeams(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], score: numScore }
    }));
  };
  
  const toggleParticipantStats = (participantId) => {
    setExpandedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const toggleTeamEdit = (teamId) => {
    setEditingTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };
  
  const exportToCSV = () => {
    // Build header with dynamic stat names
    const statHeaders = labels.join(',');
    const missionEffectHeaders = labels.map(label => `Mission Effect ${label}`).join(',');
    const participantEffectHeaders = labels.map(label => `Participant Effect ${label}`).join(',');
    let csv = `Type,Team ID,Team Name,Team Score,Participant ID,Participant Name,${statHeaders},Modifier ID,Modifier Name,Description,${missionEffectHeaders},${participantEffectHeaders},Photo Path\n`;
    
    // Export title (stored in Team Name column)
    // Header has: Type(1) + Team ID(1) + Team Name(1) + Team Score(1) + Participant ID(1) + Participant Name(1) + Stats(labels.length) + Modifier ID(1) + Modifier Name(1) + Description(1) + Mission Effects(labels.length) + Participant Effects(labels.length) + Photo Path(1)
    // Title row: Title(1) + empty(1) + pageTitle(1) + empty columns for the rest
    const totalColumns = 1 + 1 + 1 + 1 + 1 + 1 + labels.length + 1 + 1 + 1 + labels.length + labels.length + 1; // 28 total
    const emptyColumnsAfterTitle = Array(totalColumns - 3).fill('').join(','); // Minus Title, empty, and pageTitle
    csv += `Title,,${pageTitle || ''},${emptyColumnsAfterTitle}\n`;
    
    // Export team data
    Object.entries(teams).forEach(([teamId, team]) => {
      Object.entries(team.participants).forEach(([participantId, participant]) => {
        // Participant row: Type(1) + Team ID(1) + Team Name(1) + Team Score(1) + Participant ID(1) + Participant Name(1) + Stats(labels.length) + empty modifier columns(3 + labels.length*2) + Photo Path(1)
        const emptyModifierColumns = Array(3 + labels.length * 2).fill('').join(','); // Modifier ID, Name, Description + mission effects + participant effects
        csv += `Participant,${teamId},${team.name},${team.score || 0},${participantId},${participant.name},${participant.stats.join(',')},${emptyModifierColumns},,\n`;
      });
    });
    
    // Export mission data
    Object.entries(missions).forEach(([missionId, mission]) => {
      // Mission row: Type(1) + Mission ID(1) + Mission Name(1) + empty(3) + Stats(labels.length) + empty modifier columns(3 + labels.length*2) + Photo Path(1)
      const emptyModifierColumns = Array(3 + labels.length * 2).fill('').join(',');
      csv += `Mission,${missionId},${mission.name},,,,${mission.stats.join(',')},${emptyModifierColumns},${mission.photoPath || ''}\n`;
    });
    
    // Export modifier data
    Object.entries(modifiers).forEach(([modifierId, modifier]) => {
      // Modifier row: Type(1) + empty(5) + empty stats(labels.length) + Modifier ID(1) + Modifier Name(1) + Description(1) + Mission Effects(labels.length) + Participant Effects(labels.length) + Photo Path(1)
      const emptyParticipantColumns = Array(5 + labels.length).fill('').join(','); // Empty columns before modifier data
      csv += `Modifier,${emptyParticipantColumns},${modifierId},${modifier.name},"${modifier.description}",${modifier.missionEffect.join(',')},${modifier.participantEffect.join(',')},\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar_chart_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const newTeams = {};
        const newMissions = {};
        const newModifiers = {};
        
        // Detect CSV format by checking header
        const header = lines[0] || '';
        const hasTeamScore = header.includes('Team Score');
        const hasModifiers = header.includes('Modifier ID');
        
        // Helper function to parse CSV line handling quoted fields
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };
        
        // Extract stat names from header
        const headerParts = parseCSVLine(header);
        const statsStartIdx = hasTeamScore ? 6 : 5; // After: Type, Team ID, Team Name, [Team Score], Participant ID, Participant Name
        const importedStatNames = headerParts.slice(statsStartIdx, statsStartIdx + 6);
        
        // Update labels if we found stat columns in the header (use defaults for empty names)
        if (importedStatNames.length === 6) {
          const defaultStatNames = ['Stat A', 'Stat B', 'Stat C', 'Stat D', 'Stat E', 'Stat F'];
          const newLabels = importedStatNames.map((name, index) => {
            const trimmed = name ? name.trim() : '';
            return trimmed || defaultStatNames[index];
          });
          console.log('Updating labels from CSV:', newLabels);
          setLabels(newLabels);
        } else {
          console.warn('Expected 6 stat columns, found:', importedStatNames.length, importedStatNames);
        }
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = parseCSVLine(line);
          const type = parts[0];
          
          if (type === 'Title') {
            const incomingTitle = parts[2] || '';
            if (incomingTitle) setPageTitle(incomingTitle);
          } else if (type === 'Participant') {
            const teamId = parts[1];
            const teamName = parts[2];
            // Handle both old format (no team score) and new format (with team score)
            let teamScore = 0;
            let participantId, participantName, statsStartIdx;
            
            if (hasTeamScore) {
              teamScore = parts[3] ? parseFloat(parts[3]) : 0;
              participantId = parts[4];
              participantName = parts[5];
              statsStartIdx = 6;
            } else {
              // Old format: Type,Team ID,Team Name,Participant ID,Participant Name,Stats...
              participantId = parts[3];
              participantName = parts[4];
              statsStartIdx = 5;
            }
            
            const stats = parts.slice(statsStartIdx, statsStartIdx + 6).map(s => {
              const num = parseFloat(s);
              return isNaN(num) ? 0 : num;
            });
            
            if (!newTeams[teamId]) {
              newTeams[teamId] = { name: teamName, score: isNaN(teamScore) ? 0 : teamScore, participants: {} };
            }
            
            // Update team score if this is the first participant (to avoid overwriting)
            if (isNaN(newTeams[teamId].score) || newTeams[teamId].score === undefined) {
              newTeams[teamId].score = isNaN(teamScore) ? 0 : teamScore;
            }
            
            newTeams[teamId].participants[participantId] = {
              name: participantName,
              stats: stats
            };
          } else if (type === 'Mission') {
            const missionId = parts[1];
            const missionName = parts[2];
            // Handle both formats - stats start at different positions
            const statsStartIdx = hasTeamScore ? 6 : 5;
            const stats = parts.slice(statsStartIdx, statsStartIdx + 6).map(s => {
              const num = parseFloat(s);
              return isNaN(num) ? 0 : num;
            });
            
            // Get photo path (last column, if present and not empty)
            // Photo path is always the last column: after Type(1) + Team ID(1) + Team Name(1) + Team Score(1) + Participant ID(1) + Participant Name(1) + Stats(6) + Modifier ID(1) + Modifier Name(1) + Description(1) + Mission Effects(6) + Participant Effects(6) = index 27
            const numStats = importedStatNames.length || 6; // Use imported stat count, fallback to 6
            const photoPathIndex = 6 + numStats + 3 + numStats + numStats; // Base(6) + Stats + Modifier(3) + Mission Effects + Participant Effects
            const photoPath = parts.length > photoPathIndex && parts[photoPathIndex] ? parts[photoPathIndex].trim() : '';
            
            newMissions[missionId] = {
              name: missionName,
              stats: stats,
              photoPath: photoPath || (missionId === 'alpha' ? '/photos/photo_a.jpg' : 
                                      missionId === 'beta' ? '/photos/photo_b.jpg' :
                                      missionId === 'gamma' ? '/photos/photo_c.jpg' :
                                      missionId === 'delta' ? '/photos/photo_d.jpg' : `/photos/photo_${missionId}.jpg`)
            };
          } else if (type === 'Modifier' && hasModifiers) {
            const modifierId = parts[12];
            const modifierName = parts[13];
            const description = parts[14] || '';
            const missionEffect = parts.slice(15, 21).map(s => {
              const num = parseFloat(s);
              return isNaN(num) ? 0 : num;
            });
            const participantEffect = parts.slice(21, 27).map(s => {
              const num = parseFloat(s);
              return isNaN(num) ? 0 : num;
            });
            
            if (modifierId) {
              newModifiers[modifierId] = {
                name: modifierName || `Modifier ${modifierId}`,
                description: description,
                missionEffect: missionEffect,
                participantEffect: participantEffect
              };
            }
          }
        }
        
        let importCount = 0;
        
        if (Object.keys(newTeams).length > 0) {
          setTeams(newTeams);
          // Select all participants from the first team by default
          const firstTeamId = Object.keys(newTeams)[0];
          const firstTeamParticipantIds = Object.keys(newTeams[firstTeamId].participants);
          setSelectedIndividualIds(firstTeamParticipantIds);
          importCount++;
        }
        
        if (Object.keys(newMissions).length > 0) {
          setMissions(newMissions);
          const firstMissionId = Object.keys(newMissions)[0];
          setCurrentMissionId(firstMissionId);
          importCount++;
        }
        
        if (Object.keys(newModifiers).length > 0) {
          setModifiers(newModifiers);
          importCount++;
        }
        
        if (importCount > 0) {
          // Reset animation state to force complete re-render
          setIsAnimating(false);
          setResult(null);
          setAnimationTime(0);
          setBallPosition({ x: 0, y: 0 });
          setBallVelocity({ x: 0, y: 0 });
          
          const teamCount = Object.keys(newTeams).length;
          const participantCount = Object.values(newTeams).reduce((sum, team) => sum + Object.keys(team.participants).length, 0);
          const missionCount = Object.keys(newMissions).length;
          const modifierCount = Object.keys(newModifiers).length;
          
          let message = `Successfully imported:\n- ${missionCount} mission(s)\n- ${teamCount} team(s)\n- ${participantCount} participant(s)`;
          if (modifierCount > 0) {
            message += `\n- ${modifierCount} modifier(s)`;
          }
          alert(message);
        } else {
          alert('No valid data found in CSV file.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing CSV file. Please check the file format.');
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };
  
  const allIndividuals = getAllIndividuals();
  
  // Calculate overlap percentage - memoized to avoid recalculation on every render
  const overlapPercentage = useMemo(() => {
    const bluePolygon = getPolygonPoints(getCurrentMissionStats());
    const redPolygon = getPolygonPoints(getSelectedIndividualsTotalStats());
    return calculateOverlapPercentage(bluePolygon, redPolygon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMissionId, selectedIndividualIds, selectedModifierIds, teams, missions]);

  // Team colors - 4 distinct colors that are visible from a distance
  const teamColors = {
    team1: '#3B82F6', // Blue
    team2: '#EF4444', // Red
    team3: '#10B981', // Green
    team4: '#8B5CF6'  // Purple
  };

  // Get highest and lowest scoring teams
  const getTeamScores = () => {
    return Object.entries(teams).map(([teamId, team]) => ({
      teamId,
      score: team.score || 0
    }));
  };

  const teamScores = getTeamScores();
  const sortedScores = [...teamScores].sort((a, b) => b.score - a.score);
  const highestScore = sortedScores[0]?.score;
  const lowestScore = sortedScores[sortedScores.length - 1]?.score;
  const highestTeams = sortedScores.filter(t => t.score === highestScore && highestScore !== lowestScore).map(t => t.teamId);
  const lowestTeams = sortedScores.filter(t => t.score === lowestScore && highestScore !== lowestScore).map(t => t.teamId);

  // Calculate color based on probability percentage
  const getProbabilityColor = (percentage) => {
    if (percentage < 25) {
      // Red to orange transition (0-25%)
      const ratio = percentage / 25;
      const r = 239; // Red
      const g = Math.round(68 + (119 - 68) * ratio); // 68 to 119
      const b = 68;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (percentage < 50) {
      // Orange to yellow transition (25-50%)
      const ratio = (percentage - 25) / 25;
      const r = 239; // Orange
      const g = Math.round(119 + (217 - 119) * ratio); // 119 to 217
      const b = 68;
      return `rgb(${r}, ${g}, ${b})`;
    } else if (percentage < 75) {
      // Yellow-green transition (50-75%)
      const ratio = (percentage - 50) / 25;
      const r = Math.round(217 - (34 - 217) * ratio); // 217 to 34
      const g = 217;
      const b = Math.round(68 + (197 - 68) * ratio); // 68 to 197
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Green (75%+)
      return 'rgb(34, 197, 94)';
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 p-1" style={{ fontSize: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 3-Column Layout */}
      <div style={{ flex: 1, display: 'flex', gap: '4px', minHeight: 0, overflow: 'hidden' }}>
        {/* Left Column - Mission, Modifiers, Selected Individuals */}
        <div className="bg-gray-800 border border-gray-600 rounded p-1" style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
          {/* Mission */}
          <div className="bg-purple-900 border border-purple-700 rounded p-1 flex-shrink-0">
            <div className="font-semibold text-purple-200 mb-0.5" style={{ fontSize: '10px' }}>Mission</div>
            <select
              value={currentMissionId}
              onChange={(e) => setCurrentMissionId(e.target.value)}
              className="w-full bg-gray-800 text-gray-100 border border-gray-600 rounded px-1 py-0.5"
              style={{ fontSize: '10px' }}
            >
              {Object.entries(missions).map(([id, mission]) => (
                <option key={id} value={id}>{mission.name}</option>
              ))}
            </select>
          </div>

          {/* Modifiers */}
          <div className="bg-green-900 border border-green-700 rounded p-1 flex-shrink-0">
            <div className="font-semibold text-green-200 mb-0.5" style={{ fontSize: '10px' }}>Modifiers</div>
            <select
              multiple
              value={selectedModifierIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedModifierIds(selected);
              }}
              className="w-full bg-gray-800 text-gray-100 border border-gray-600 rounded px-1 py-0.5"
              style={{ fontSize: '10px', minHeight: '60px', maxHeight: '60px' }}
            >
              {Object.entries(modifiers).map(([modifierId, modifier]) => (
                <option key={modifierId} value={modifierId}>{modifier.name}</option>
              ))}
            </select>
            <div className="text-gray-300 mt-0.5" style={{ fontSize: '9px' }}>
              {selectedModifierIds.length}/{Object.keys(modifiers).length}
            </div>
          </div>

          {/* Selected Individuals - Grouped by team, 2 columns */}
          <div className="bg-orange-900 border border-orange-700 rounded p-1 flex-1 flex flex-col" style={{ minHeight: 0 }}>
            <div className="font-semibold text-orange-200 mb-0.5" style={{ fontSize: '10px' }}>Selected Individuals</div>
            <div className="flex-1 overflow-y-auto border border-gray-600 rounded bg-gray-800 p-0.5">
              {allIndividuals.length === 0 ? (
                <div className="text-gray-400 text-center py-1" style={{ fontSize: '9px' }}>None</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(teams).map(([teamId, team]) => {
                    const teamColor = teamColors[teamId] || '#ffffff';
                    return (
                      <div key={teamId} style={{ border: `2px solid ${teamColor}`, borderRadius: '4px', padding: '2px', backgroundColor: `${teamColor}20` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', rowGap: '2px' }}>
                          {Object.entries(team.participants).map(([participantId, participant]) => (
                            <label
                              key={participantId}
                              className="flex items-center gap-0.5 p-0.5 hover:bg-gray-700 rounded cursor-pointer"
                              style={{ fontSize: '8px', backgroundColor: selectedIndividualIds.includes(participantId) ? `${teamColor}40` : 'transparent' }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIndividualIds.includes(participantId)}
                                onChange={() => toggleIndividualSelection(participantId)}
                                className="cursor-pointer"
                                style={{ width: '8px', height: '8px', flexShrink: 0 }}
                              />
                              <span className="text-gray-100 truncate" style={{ fontSize: '8px' }}>{participant.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="text-gray-300 mt-0.5" style={{ fontSize: '9px' }}>
              {selectedIndividualIds.length}/{allIndividuals.length}
            </div>
          </div>

          {/* Mission Photo Display */}
          <div className="bg-gray-800 border border-gray-600 rounded p-1 flex-shrink-0" style={{ minHeight: '150px' }}>
            <div className="flex items-center justify-between mb-0.5">
              <div className="font-semibold text-gray-200" style={{ fontSize: '10px' }}>Mission Photo</div>
              <div className="flex items-center gap-1">
                <label className="flex items-center gap-0.5 cursor-pointer" style={{ fontSize: '8px' }}>
                  <input
                    type="checkbox"
                    checked={showPhotoOnRight}
                    onChange={(e) => setShowPhotoOnRight(e.target.checked)}
                    className="cursor-pointer"
                    style={{ width: '8px', height: '8px' }}
                  />
                  <span className="text-gray-300">Right</span>
                </label>
                {missions[currentMissionId]?.photoPath && !photoError && (
                  <button
                    onClick={() => setIsPhotoFullscreen(true)}
                    className="bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                    style={{ fontSize: '8px', padding: '2px 4px' }}
                    title="Expand photo"
                  >
                    <Maximize2 size={10} />
                  </button>
                )}
              </div>
            </div>
            <div 
              className="bg-white rounded flex items-center justify-center"
              style={{ 
                minHeight: '120px',
                padding: '8px',
                border: '3px solid #ffffff',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {missions[currentMissionId]?.photoPath && !photoError ? (
                <img
                  src={missions[currentMissionId].photoPath}
                  alt={`${missions[currentMissionId]?.name || 'Mission'} Photo`}
                  onError={() => setPhotoError(true)}
                  className="max-w-full max-h-full object-contain"
                  style={{ display: 'block', maxHeight: '104px' }}
                />
              ) : (
                <div 
                  className="text-gray-400 text-center"
                  style={{ fontSize: '9px' }}
                >
                  {missions[currentMissionId]?.photoPath ? 'Photo not found' : 'No photo available'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column - Title, Team Scores, Probability, Radar Chart */}
        <div style={{ flex: '0 0 auto', width: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, overflow: 'hidden', height: '100%', alignSelf: 'stretch' }}>
          {/* Title */}
          <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="bg-gray-800 text-gray-100 border border-gray-600 rounded px-2 py-0.5"
              style={{ fontSize: '28px', width: '100%', maxWidth: '500px', textAlign: 'center', fontWeight: 'bold' }}
            />
          </div>

          {/* Team Scores Row - All in one row with bigger gaps */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'nowrap' }}>
            {Object.entries(teams).map(([teamId, team]) => {
              const isHighest = highestTeams.includes(teamId);
              const isLowest = lowestTeams.includes(teamId);
              const teamColor = teamColors[teamId] || '#ffffff';
              return (
                <div key={teamId} className="flex items-center gap-0.5 bg-gray-800 border border-gray-600 rounded px-1 py-0.5">
                  <span className="font-bold" style={{ fontSize: '10px', minWidth: '35px', color: teamColor }}>
                    {isHighest && '👑 '}
                    {isLowest && '💩 '}
                    {team.name}:
                  </span>
                  <button
                    onClick={() => updateTeamScore(teamId, (team.score || 0) - 1)}
                    className="bg-red-900 text-red-200 rounded hover:bg-red-800"
                    style={{ fontSize: '8px', padding: '1px 2px', lineHeight: '1' }}
                  >
                    <Minus size={8} />
                  </button>
                  <input
                    type="number"
                    value={team.score || 0}
                    onChange={(e) => updateTeamScore(teamId, e.target.value)}
                    className="text-center bg-gray-700 text-gray-100 border border-gray-600 rounded"
                    style={{ fontSize: '9px', width: '24px', padding: '1px', height: '16px' }}
                  />
                  <button
                    onClick={() => updateTeamScore(teamId, (team.score || 0) + 1)}
                    className="bg-green-900 text-green-200 rounded hover:bg-green-800"
                    style={{ fontSize: '8px', padding: '1px 2px', lineHeight: '1' }}
                  >
                    <Plus size={8} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Polygon Visibility - Between Team Points and Mission Success */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0 }}>
            <div className="flex items-center gap-2" style={{ fontSize: '9px' }}>
              <label className="flex items-center gap-0.5 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={showMissionPolygon}
                  onChange={(e) => setShowMissionPolygon(e.target.checked)}
                  className="cursor-pointer"
                  style={{ width: '10px', height: '10px' }}
                />
                <span>Show Mission</span>
              </label>
              <label className="flex items-center gap-0.5 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={showTeamPolygon}
                  onChange={(e) => setShowTeamPolygon(e.target.checked)}
                  className="cursor-pointer"
                  style={{ width: '10px', height: '10px' }}
                />
                <span>Show Team</span>
              </label>
            </div>
          </div>

          {/* Mission Success Probability */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0 }}>
            <div 
              className="font-bold px-2 py-0.5 rounded"
              style={{ 
                fontSize: '18px',
                color: getProbabilityColor(overlapPercentage),
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}
            >
              Mission Success Probability: <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{overlapPercentage.toFixed(1)}%</span>
            </div>
          </div>

          {/* Radar Chart */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
              <canvas 
                ref={canvasRef} 
                width={500} 
                height={500}
                className="border border-gray-600 rounded"
                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }}
              />
              <button
                onClick={startAnimation}
                disabled={isAnimating || !showMissionPolygon || !showTeamPolygon}
                className="bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '20px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Play size={20} />
                Start
              </button>
              {isAnimating && (
                <div className="bg-yellow-900 text-yellow-100 rounded" style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '9px', padding: '2px 4px' }}>
                  {(animationTime / 1000).toFixed(1)}s / {ANIMATION_DURATION / 1000}s
                </div>
              )}
            </div>
          </div>

          {/* CSV Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700 flex items-center gap-0.5"
              style={{ fontSize: '9px' }}
            >
              <Download size={10} />
              Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 text-white px-2 py-0.5 rounded hover:bg-purple-700 flex items-center gap-0.5"
              style={{ fontSize: '9px' }}
            >
              <Upload size={10} />
              Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={importFromCSV}
              className="hidden"
            />
          </div>
        </div>

        {/* Right Column - Team Manager */}
        <div className="bg-gray-800 border border-gray-600 rounded p-1" style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {Object.entries(teams).map(([teamId, team]) => {
              const isEditing = editingTeams.has(teamId);
              const teamColor = teamColors[teamId] || '#ffffff';
              return (
                <div key={teamId} className="mb-1 p-1 bg-gray-700 rounded border border-gray-600">
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => updateTeamName(teamId, e.target.value)}
                          onBlur={() => toggleTeamEdit(teamId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') toggleTeamEdit(teamId);
                          }}
                          autoFocus
                          className="flex-1 bg-gray-800 border border-gray-600 rounded px-0.5 py-0"
                          style={{ fontSize: '11px', fontWeight: 'bold', color: teamColor }}
                        />
                        <button
                          onClick={() => toggleTeamEdit(teamId)}
                          className="bg-blue-900 text-blue-200 px-0.5 py-0 rounded hover:bg-blue-800"
                          style={{ fontSize: '8px' }}
                        >
                          ✓
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-bold" style={{ fontSize: '11px', color: teamColor }}>{team.name}</span>
                        <button
                          onClick={() => toggleTeamEdit(teamId)}
                          className="bg-gray-600 text-gray-200 px-0.5 py-0 rounded hover:bg-gray-500"
                          style={{ fontSize: '8px' }}
                        >
                          ✎
                        </button>
                      </>
                    )}
                  </div>
                  {Object.entries(team.participants).map(([pId, participant]) => (
                    <ParticipantRow
                      key={pId}
                      teamId={teamId}
                      pId={pId}
                      participant={participant}
                      isExpanded={expandedParticipants.has(pId)}
                      onToggle={() => toggleParticipantStats(pId)}
                      onNameChange={updateParticipantName}
                      onStatChange={updateParticipantStat}
                      labels={labels}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <button
            onClick={addTeam}
            className="w-full bg-blue-900 text-blue-200 px-1 py-0.5 rounded hover:bg-blue-800 mt-1 flex-shrink-0"
            style={{ fontSize: '9px' }}
          >
            + Add Team
          </button>
        </div>

        {/* Photo Column - Right Side */}
        {showPhotoOnRight && missions[currentMissionId]?.photoPath && !photoError && (
          <div className="bg-gray-800 border border-gray-600 rounded p-1" style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
              <div className="font-semibold text-gray-200" style={{ fontSize: '12px' }}>Mission Photo</div>
              <button
                onClick={() => setIsPhotoFullscreen(true)}
                className="bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                style={{ fontSize: '10px', padding: '4px 8px' }}
                title="Expand photo"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <div 
              className="bg-white rounded flex items-center justify-center flex-1"
              style={{ 
                minHeight: 0,
                padding: '12px',
                border: '3px solid #ffffff',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <img
                src={missions[currentMissionId].photoPath}
                alt={`${missions[currentMissionId]?.name || 'Mission'} Photo`}
                onError={() => setPhotoError(true)}
                className="max-w-full max-h-full object-contain"
                style={{ display: 'block' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Photo Overlay */}
      {isPhotoFullscreen && missions[currentMissionId]?.photoPath && !photoError && createPortal(
        <div
          onClick={() => setIsPhotoFullscreen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '95vw',
              maxHeight: '95vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={missions[currentMissionId].photoPath}
              alt={`${missions[currentMissionId]?.name || 'Mission'} Photo`}
              style={{
                maxWidth: '100%',
                maxHeight: '95vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <button
              onClick={() => setIsPhotoFullscreen(false)}
              className="bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                zIndex: 100000
              }}
              title="Close"
            >
              <X size={24} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RadarMissionAnimation;