import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, RotateCcw, Users, Target, Plus, Minus, Trash2, Download, Upload, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const RadarMissionAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const [labels] = useState(['Stat A', 'Stat B', 'Stat C', 'Stat D', 'Stat E', 'Stat F']);
  
  // Missions state (now dynamic)
  const [missions, setMissions] = useState({
    alpha: { name: "Mission Alpha", stats: [6, 8, 4, 9, 6, 7] },
    beta: { name: "Mission Beta", stats: [7, 5, 8, 6, 7, 5] },
    gamma: { name: "Mission Gamma", stats: [5, 9, 6, 7, 5, 8] },
    delta: { name: "Mission Delta", stats: [8, 6, 7, 8, 9, 6] }
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
        p1: { name: "Gordon", stats: [3, 3, 3, 3, 3, 3] },
        p2: { name: "Alvina", stats: [2, 2, 2, 1, 2, 1] }
      }
    },
    team2: {
      name: "Team 2",
      score: 0,
      participants: {
        p3: { name: "Alvin", stats: [1, 2, 2, 2, 2, 1] },
        p4: { name: "Matt", stats: [3, 3, 3, 3, 3, 3] }
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
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const ANIMATION_DURATION = 3000;
  const INITIAL_SPEED = 15;
  const MAX_STAT_VALUE = 10;
  const CENTER_X = 400;
  const CENTER_Y = 400;
  const MAX_RADIUS = 300;
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
    ctx.clearRect(0, 0, 800, 800);
    
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
      ctx.stroke();
      
      const labelPos = polarToCartesian(angle, MAX_RADIUS + 30);
      ctx.fillText(label, labelPos.x, labelPos.y);
      
      for (let j = 2; j <= 10; j += 2) {
        const scalePos = polarToCartesian(angle, (j / MAX_STAT_VALUE) * MAX_RADIUS);
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.fillText(j.toString(), scalePos.x + 10, scalePos.y);
      }
    });
    
    // Draw mission polygon (blue) - only if enabled
    if (showMissionPolygon) {
      const missionPoints = getPolygonPoints(getCurrentMissionStats());
      ctx.beginPath();
      ctx.strokeStyle = '#4A90E2';
      ctx.fillStyle = 'rgba(74, 144, 226, 0.2)';
      ctx.lineWidth = 3;
      missionPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    // Draw selected individuals polygon (red dashed) - only if enabled
    if (showTeamPolygon) {
      const selectedIndividualsPoints = getPolygonPoints(getSelectedIndividualsTotalStats());
      ctx.beginPath();
      ctx.strokeStyle = '#E74C3C';
      ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
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
  }, [isAnimating, currentMissionId, selectedIndividualIds, selectedModifierIds, teams, missions, showMissionPolygon, showTeamPolygon]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawRadarChart(ctx);
    }
  }, [currentMissionId, selectedIndividualIds, selectedModifierIds, teams, missions, showMissionPolygon, showTeamPolygon]);
  
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
          [newId]: { name: `Participant ${Object.keys(prev[teamId].participants).length + 1}`, stats: [0, 0, 0, 0, 0, 0] }
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
          [newParticipantId]: { name: "Member 1", stats: [0, 0, 0, 0, 0, 0] }
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
  
  const exportToCSV = () => {
    let csv = 'Type,Team ID,Team Name,Team Score,Participant ID,Participant Name,Stat A,Stat B,Stat C,Stat D,Stat E,Stat F,Modifier ID,Modifier Name,Description,Mission Effect A,Mission Effect B,Mission Effect C,Mission Effect D,Mission Effect E,Mission Effect F,Participant Effect A,Participant Effect B,Participant Effect C,Participant Effect D,Participant Effect E,Participant Effect F\n';
    
    // Export team data
    Object.entries(teams).forEach(([teamId, team]) => {
      Object.entries(team.participants).forEach(([participantId, participant]) => {
        csv += `Participant,${teamId},${team.name},${team.score || 0},${participantId},${participant.name},${participant.stats.join(',')},,,,,,,,,,,,,,\n`;
      });
    });
    
    // Export mission data
    Object.entries(missions).forEach(([missionId, mission]) => {
      csv += `Mission,${missionId},${mission.name},,,,${mission.stats.join(',')},,,,,,,,,,,,,,\n`;
    });
    
    // Export modifier data
    Object.entries(modifiers).forEach(([modifierId, modifier]) => {
      csv += `Modifier,,,,,,,,,,,${modifierId},${modifier.name},"${modifier.description}",${modifier.missionEffect.join(',')},${modifier.participantEffect.join(',')}\n`;
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
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = parseCSVLine(line);
          const type = parts[0];
          
          if (type === 'Participant') {
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
            
            newMissions[missionId] = {
              name: missionName,
              stats: stats
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
  
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-6" style={{ maxWidth: '1800px', width: '100%' }}>
        
        <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={800}
              className="border border-gray-300 rounded"
              style={{ display: 'block' }}
            />
          </div>
          
          <div style={{ flexShrink: 0, width: '20rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Polygon Visibility</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMissionPolygon}
                    onChange={(e) => setShowMissionPolygon(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Show Mission</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTeamPolygon}
                    onChange={(e) => setShowTeamPolygon(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Show Team</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={startAnimation}
                disabled={isAnimating || !showMissionPolygon || !showTeamPolygon}
                className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                <Play size={20} />
                Start
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div className="mb-2">
                  <h4 className="font-semibold text-purple-800">Mission</h4>
                </div>
                <select
                  value={currentMissionId}
                  onChange={(e) => setCurrentMissionId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                  title={missions[currentMissionId]?.name}
                >
                  {Object.entries(missions).map(([id, mission]) => (
                    <option key={id} value={id}>{mission.name}</option>
                  ))}
                </select>
                
                {showMissionPolygon && showTeamPolygon && (
                  <div className="mt-3 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded" style={{ opacity: 0.7 }}></div>
                      <div className="w-4 h-4 bg-blue-500 rounded" style={{ opacity: 0.7, marginLeft: '-8px' }}></div>
                      <h4 className="font-semibold text-indigo-800 text-sm">Mission Success Probability: {overlapPercentage.toFixed(1)}%</h4>
                    </div>
                  </div>
                )}
                
                <div className={`mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200 ${isAnimating ? '' : 'invisible'}`}>
                  <div className="text-sm font-semibold"> 
                    {(animationTime / 1000).toFixed(1)}s / {ANIMATION_DURATION / 1000}s
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div className="mb-2">
                  <h4 className="font-semibold text-green-800">Modifiers</h4>
                </div>
                <div style={{ overflowX: 'auto', overflowY: 'visible', width: '100%' }}>
                  <select
                    multiple
                    value={selectedModifierIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedModifierIds(selected);
                    }}
                    className="px-3 py-2 border rounded-lg"
                    style={{ minHeight: '100px', minWidth: '100%', whiteSpace: 'nowrap' }}
                  >
                    {Object.entries(modifiers).map(([modifierId, modifier]) => (
                      <option key={modifierId} value={modifierId}>
                        {modifier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selectedModifierIds.length} of {Object.keys(modifiers).length} selected (hold Ctrl/Cmd to select multiple)
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800">Selected Individuals</h4>
                <>
                  <div className="max-h-48 overflow-y-auto border rounded-lg bg-white p-2 mb-2">
                    {allIndividuals.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-2">No individuals available</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {Object.entries(teams).map(([teamId, team]) => (
                          <div key={teamId} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                            <div className="font-semibold text-sm text-gray-700 mb-1">{team.name}</div>
                            {Object.entries(team.participants).map(([participantId, participant]) => (
                              // to ensure each participant is rendered on a new line
                              <div>
                              <label
                                key={participantId}
                                className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIndividualIds.includes(participantId)}
                                  onChange={() => toggleIndividualSelection(participantId)}
                                  className="cursor-pointer"
                                />
                                  {participant.name}
                              </label>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedIndividualIds.length} of {allIndividuals.length} selected
                  </div>
                </>
            </div>
          </div>
          
          <div style={{ flexShrink: 0, width: '20rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-gray-800">Team Manager</h4>
              </div>
              
              <div className="mb-3">
                
                {Object.entries(teams).map(([teamId, team]) => (
                  <div key={teamId} className="mb-4 p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => updateTeamName(teamId, e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm font-medium"
                          placeholder="Team Name"
                        />
                        <button
                          onClick={() => addParticipant(teamId)}
                          className="bg-green-500 text-white p-1 rounded hover:bg-green-600 flex items-center justify-center"
                          title="Add Participant"
                        >
                          <Plus size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                          <label className="text-xs font-medium text-gray-700">Score:</label>
                          <button
                            onClick={() => updateTeamScore(teamId, (team.score || 0) - 1)}
                            className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            value={team.score || 0}
                            onChange={(e) => updateTeamScore(teamId, e.target.value)}
                            className="w-16 px-2 py-1 border rounded text-sm text-center"
                            step="1"
                          />
                          <button
                            onClick={() => updateTeamScore(teamId, (team.score || 0) + 1)}
                            className="bg-green-100 text-green-600 p-1 rounded hover:bg-green-200"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.entries(team.participants).map(([pId, participant]) => {
                      const isExpanded = expandedParticipants.has(pId);
                      return (
                        <div key={pId} className="mb-2 p-2 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={participant.name}
                              onChange={(e) => updateParticipantName(teamId, pId, e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm font-medium"
                            />
                            <button
                              onClick={() => toggleParticipantStats(pId)}
                              className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-200 flex-shrink-0"
                              title={isExpanded ? "Hide stats" : "Show stats"}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button
                              onClick={() => removeParticipant(teamId, pId)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 flex-shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              {labels.map((label, statIndex) => (
                                <div key={statIndex} className="flex items-center justify-between mb-1">
                                  <span className="text-xs w-16">{label}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => updateParticipantStat(teamId, pId, statIndex, -1)}
                                      className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="text-xs font-semibold w-8 text-center">
                                      {participant.stats[statIndex]}
                                    </span>
                                    <button
                                      onClick={() => updateParticipantStat(teamId, pId, statIndex, 1)}
                                      className="bg-green-100 text-green-600 p-1 rounded hover:bg-green-200"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addTeam}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
              >
                + Add New Team
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 text-center max-w-2xl">
        <p><strong>How it works:</strong> Select a mission and choose individuals from any team, then click "Start". The ball bounces like a billiard ball for 5 seconds. 
        If it lands within the selected individuals' total stats (sum of all selected participants), the mission passes!</p>
        <p className="mt-2"><strong>Tip:</strong> Use the Team Manager (user icon) to add teams, participants and adjust individual stats. Select multiple individuals from different teams to form your group. Export your data to CSV or import from a previously exported file.</p>
      </div>
      
      <div className="mt-4 flex gap-2 justify-center max-w-md mx-auto">
        <button
          onClick={exportToCSV}
          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 text-sm"
        >
          <Upload size={16} />
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
  );
};

export default RadarMissionAnimation;