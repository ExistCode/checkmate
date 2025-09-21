'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { computeCredibilityFromUrl } from '@/lib/analysis/parseOriginTracing';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Globe,
  Users,
  MessageSquare,
  Video,
  Megaphone,
  FileText,
  Shield,
  Brain,
  Clock,
  TrendingUp,
  Share2
} from 'lucide-react';

interface OriginTracingData {
  hypothesizedOrigin?: string;
  firstSeenDates?: Array<{ source: string; date?: string; url?: string }>;
  propagationPaths?: string[];
  evolutionSteps?: Array<{ platform: string; transformation: string; impact?: string; date?: string }>;
}

interface BeliefDriver {
  name: string;
  description: string;
  references?: Array<{ title: string; url: string }>;
}

interface FactCheckSource {
  url: string;
  title: string;
  source?: string;
  credibility: number;
}

interface OriginTracingDiagramProps {
  originTracing?: OriginTracingData;
  beliefDrivers?: BeliefDriver[];
  sources?: FactCheckSource[];
  verdict?: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
  content?: string;
  allLinks?: Array<{ url: string; title?: string }>;
}

// Custom node components
interface NodeData {
  label: string;
  verdict?: string;
  credibility?: number;
  url?: string;
  name?: string;
  description?: string;
  references?: Array<{ title: string; url: string }>;
  platform?: string;
  impact?: string;
}

// Helper function to get platform/source icons
const getPlatformIcon = (source: string) => {
  const lowerSource = source.toLowerCase();
  
  // Social Media Platforms
  if (lowerSource.includes('twitter') || lowerSource.includes('x.com')) {
    return <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center text-xs font-bold">X</div>;
  }
  if (lowerSource.includes('facebook')) {
    return <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">f</div>;
  }
  if (lowerSource.includes('instagram')) {
    return <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded flex items-center justify-center text-xs font-bold">📷</div>;
  }
  if (lowerSource.includes('tiktok')) {
    return <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center text-xs font-bold">🎵</div>;
  }
  if (lowerSource.includes('youtube')) {
    return <div className="w-5 h-5 bg-red-600 text-white rounded flex items-center justify-center text-xs font-bold">▶</div>;
  }
  if (lowerSource.includes('telegram')) {
    return <div className="w-5 h-5 bg-blue-500 text-white rounded flex items-center justify-center text-xs font-bold">✈</div>;
  }
  if (lowerSource.includes('whatsapp')) {
    return <div className="w-5 h-5 bg-green-500 text-white rounded flex items-center justify-center text-xs font-bold">💬</div>;
  }
  if (lowerSource.includes('reddit')) {
    return <div className="w-5 h-5 bg-orange-500 text-white rounded flex items-center justify-center text-xs font-bold">R</div>;
  }
  if (lowerSource.includes('discord')) {
    return <div className="w-5 h-5 bg-indigo-500 text-white rounded flex items-center justify-center text-xs font-bold">💬</div>;
  }
  if (lowerSource.includes('linkedin')) {
    return <div className="w-5 h-5 bg-blue-700 text-white rounded flex items-center justify-center text-xs font-bold">in</div>;
  }

  // Forums and Communities
  if (lowerSource.includes('4chan') || lowerSource.includes('/pol/')) {
    return <MessageSquare className="w-5 h-5 text-green-600" />;
  }
  if (lowerSource.includes('forum') || lowerSource.includes('board')) {
    return <Users className="w-5 h-5 text-gray-600" />;
  }

  // Fact-checking Organizations
  if (lowerSource.includes('snopes')) {
    return <div className="w-5 h-5 bg-green-600 text-white rounded flex items-center justify-center text-xs font-bold">S</div>;
  }
  if (lowerSource.includes('factcheck.org')) {
    return <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">✓</div>;
  }
  if (lowerSource.includes('politifact')) {
    return <div className="w-5 h-5 bg-orange-600 text-white rounded flex items-center justify-center text-xs font-bold">P</div>;
  }
  if (lowerSource.includes('reuters')) {
    return <div className="w-5 h-5 bg-orange-500 text-white rounded flex items-center justify-center text-xs font-bold">R</div>;
  }
  if (lowerSource.includes('ap news') || lowerSource.includes('associated press')) {
    return <div className="w-5 h-5 bg-red-600 text-white rounded flex items-center justify-center text-xs font-bold">AP</div>;
  }
  if (lowerSource.includes('bbc')) {
    return <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center text-xs font-bold">BBC</div>;
  }
  if (lowerSource.includes('cnn')) {
    return <div className="w-5 h-5 bg-red-600 text-white rounded flex items-center justify-center text-xs font-bold">CNN</div>;
  }

  // Default icons by type
  if (lowerSource.includes('news') || lowerSource.includes('media')) {
    return <FileText className="w-5 h-5 text-blue-600" />;
  }
  if (lowerSource.includes('blog') || lowerSource.includes('post')) {
    return <FileText className="w-5 h-5 text-purple-600" />;
  }
  if (lowerSource.includes('video')) {
    return <Video className="w-5 h-5 text-red-600" />;
  }
  if (lowerSource.includes('influencer') || lowerSource.includes('creator')) {
    return <Megaphone className="w-5 h-5 text-pink-600" />;
  }

  // Generic fallback
  return <Globe className="w-5 h-5 text-gray-600" />;
};

const getBiasIcon = (biasName: string) => {
  const lowerName = biasName.toLowerCase();
  
  if (lowerName.includes('confirmation')) {
    return <Brain className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('availability')) {
    return <Clock className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('social') || lowerName.includes('proof')) {
    return <Users className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('trend') || lowerName.includes('bandwagon')) {
    return <TrendingUp className="w-4 h-4 text-violet-600" />;
  }
  if (lowerName.includes('sharing') || lowerName.includes('viral')) {
    return <Share2 className="w-4 h-4 text-violet-600" />;
  }
  
  return <Brain className="w-4 h-4 text-violet-600" />;
};

const OriginNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg min-w-[220px] max-w-[320px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.label)}
      </div>
      <div className="font-semibold text-blue-900 text-sm">Original Source</div>
    </div>
    <div className="text-sm text-blue-800 leading-relaxed">{data.label}</div>
  </div>
);

const PropagationNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-orange-50 border-2 border-orange-200 rounded-xl shadow-lg min-w-[200px] max-w-[280px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.platform || data.label)}
      </div>
      <div className="font-semibold text-orange-900 text-sm">Propagation</div>
    </div>
    <div className="text-sm text-orange-800 leading-relaxed">{data.label}</div>
  </div>
);

const EvolutionNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl shadow-lg min-w-[220px] max-w-[300px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.platform || data.label)}
      </div>
      <div className="font-semibold text-purple-900 text-sm">
        {data.platform || 'Evolution'}
      </div>
    </div>
    <div className="text-sm text-purple-800 leading-relaxed mb-2">{data.label}</div>
    {data.impact && (
      <div className="text-xs text-purple-600 italic">Impact: {data.impact}</div>
    )}
  </div>
);

const ClaimNode = ({ data }: { data: NodeData }) => {
  const verdictColors = {
    verified: 'bg-green-50 border-green-200 text-green-900',
    misleading: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    false: 'bg-red-50 border-red-200 text-red-900',
    unverified: 'bg-gray-50 border-gray-200 text-gray-900',
    satire: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  const verdictIcons = {
    verified: CheckCircle,
    misleading: AlertTriangle,
    false: XCircle,
    unverified: HelpCircle,
    satire: HelpCircle,
  };

  const Icon = verdictIcons[data.verdict as keyof typeof verdictIcons] || HelpCircle;

  return (
    <div className={`px-6 py-5 border-2 rounded-xl shadow-xl min-w-[280px] max-w-[400px] ${verdictColors[data.verdict as keyof typeof verdictColors] || verdictColors.unverified}`}>
      {/* All-direction handles for the central claim node */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      
      <div className="flex items-center gap-3 font-semibold mb-3">
        <Icon className="h-5 w-5" />
        <span className="text-base">Current Claim</span>
      </div>
      <div className="text-sm mb-3 leading-relaxed">{data.label}</div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-medium">
          {data.verdict}
        </Badge>
        <Shield className="h-3 w-3 opacity-60" />
      </div>
    </div>
  );
};

const SourceNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl shadow-lg min-w-[220px] max-w-[320px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getPlatformIcon(data.label)}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-emerald-900 text-sm mb-1">Fact-Check Source</div>
        <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800">
          {data.credibility}% credible
        </Badge>
      </div>
    </div>
    <div className="text-sm text-emerald-800 mb-3 leading-relaxed">{data.label}</div>
    {data.url && (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-900 underline font-medium"
      >
        View Source <ExternalLink className="h-3 w-3" />
      </a>
    )}
  </div>
);

const BeliefDriverNode = ({ data }: { data: NodeData }) => (
  <div className="px-5 py-4 bg-violet-50 border-2 border-violet-200 rounded-xl shadow-lg min-w-[220px] max-w-[360px]">
    {/* All-direction handles */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />
    
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        {getBiasIcon(data.name || '')}
      </div>
      <div className="font-semibold text-violet-900 text-sm">Why People Believe</div>
    </div>
    <div className="text-sm text-violet-800 font-medium mb-2">{data.name}</div>
    <div className="text-xs text-violet-700 leading-relaxed mb-2">{data.description}</div>
    {Array.isArray(data.references) && data.references.length > 0 && (
      <div className="mt-2 space-y-1">
        {data.references.slice(0, 2).map((ref, idx) => (
          <a
            key={idx}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[11px] text-violet-800 underline break-all"
            title={ref.title}
          >
            {ref.title}
          </a>
        ))}
      </div>
    )}
  </div>
);

const nodeTypes = {
  origin: OriginNode,
  propagation: PropagationNode,
  evolution: EvolutionNode,
  claim: ClaimNode,
  source: SourceNode,
  beliefDriver: BeliefDriverNode,
};

// Helper function to extract meaningful claim content
const extractClaimContent = (
  content?: string,
  originTracing?: OriginTracingData,
  beliefDrivers?: BeliefDriver[],
  sources?: FactCheckSource[]
): string => {
  // Try to extract from provided content first
  if (content && content.trim()) {
    // If it's a long analysis, try to find the main claim
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Look for claim-like statements (usually shorter, declarative sentences)
    const claimCandidates = lines.filter(line => 
      line.length > 10 && 
      line.length < 200 && 
      !line.startsWith('#') && 
      !line.startsWith('*') && 
      !line.includes('analysis') &&
      !line.includes('conclusion') &&
      !line.toLowerCase().includes('however') &&
      !line.toLowerCase().includes('according to')
    );
    
    if (claimCandidates.length > 0) {
      return claimCandidates[0];
    }
    
    // Fallback to first meaningful line
    const firstMeaningfulLine = lines.find(line => 
      line.length > 15 && 
      !line.startsWith('#') && 
      !line.startsWith('**')
    );
    
    if (firstMeaningfulLine) {
      return firstMeaningfulLine.length > 150 
        ? firstMeaningfulLine.substring(0, 150) + '...'
        : firstMeaningfulLine;
    }
  }
  
  // Try to extract from origin tracing
  if (originTracing?.hypothesizedOrigin) {
    return originTracing.hypothesizedOrigin.length > 150
      ? originTracing.hypothesizedOrigin.substring(0, 150) + '...'
      : originTracing.hypothesizedOrigin;
  }
  
  // Try to extract from belief drivers descriptions
  if (beliefDrivers && beliefDrivers.length > 0) {
    const firstDriver = beliefDrivers[0];
    if (firstDriver.description) {
      const desc = firstDriver.description;
      return desc.length > 150 
        ? desc.substring(0, 150) + '...'
        : desc;
    }
  }
  
  // Try to extract from sources
  if (sources && sources.length > 0) {
    return `Claim being fact-checked by ${sources.length} source${sources.length > 1 ? 's' : ''}`;
  }
  
  return 'Current Claim Under Analysis';
};

// Helper function to detect and resolve node overlaps
const resolveOverlaps = (nodes: Node[]): Node[] => {
  const resolvedNodes = [...nodes];
  const nodeSpacing = 280; // Reduced minimum spacing between nodes
  const verticalSpacing = 180; // Reduced minimum vertical spacing
  const gridSize = 40; // Snap to grid for cleaner layout
  
  // Multiple passes to resolve all overlaps
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const nodeA = resolvedNodes[i];
        const nodeB = resolvedNodes[j];
        
        const horizontalDistance = Math.abs(nodeA.position.x - nodeB.position.x);
        const verticalDistance = Math.abs(nodeA.position.y - nodeB.position.y);
        
        // Check if nodes are too close horizontally (same row-ish)
        if (verticalDistance < 120 && horizontalDistance < nodeSpacing) {
          const adjustment = nodeSpacing - horizontalDistance + 40; // Reduced buffer
          
          // Move the rightmost node further right
          if (nodeA.position.x < nodeB.position.x) {
            nodeB.position.x += adjustment;
          } else {
            nodeA.position.x += adjustment;
          }
        }
        
        // Check if nodes are too close vertically (same column-ish)
        if (horizontalDistance < 120 && verticalDistance < verticalSpacing) {
          const adjustment = verticalSpacing - verticalDistance + 40; // Reduced buffer
          
          // Move the lower node further down
          if (nodeA.position.y < nodeB.position.y) {
            nodeB.position.y += adjustment;
          } else {
            nodeA.position.y += adjustment;
          }
        }
      }
    }
  }
  
  // Snap all nodes to grid for cleaner layout
  resolvedNodes.forEach(node => {
    node.position.x = Math.round(node.position.x / gridSize) * gridSize;
    node.position.y = Math.round(node.position.y / gridSize) * gridSize;
  });
  
  return resolvedNodes;
};

// Helper function to create logical flow layout
const createLogicalFlow = (
  originNodeId: string | null,
  evolutionNodes: string[],
  claimNodeId: string,
  beliefDriverNodes: string[],
  sourceNodes: string[],
  linkNodes: string[],
  nodes: Node[]
): Node[] => {
  const centerX = 1200;
  const centerY = 400;
  
  // Create a more logical flow pattern
  const flowLayout = {
    // Origin on far left
    origin: { x: centerX - 800, y: centerY },
    
    // Evolution chain flowing left to right toward center - reduced spacing
    evolution: {
      startX: centerX - 700,
      endX: centerX - 250,
      y: centerY,
      spacing: Math.max(250, 500 / Math.max(evolutionNodes.length, 1))
    },
    
    // Claim at center-right (destination of flow)
    claim: { x: centerX, y: centerY },
    
    // Belief drivers above in arc formation - reduced spacing
    beliefs: {
      centerX: centerX - 350,
      y: centerY - 300,
      radius: 450,
      startAngle: -Math.PI / 2.5,
      endAngle: Math.PI / 2.5
    },
    
    // Sources below in arc formation - reduced spacing
    sources: {
      centerX: centerX,
      y: centerY + 300,
      radius: 450,
      startAngle: Math.PI / 4,
      endAngle: Math.PI - Math.PI / 4
    },
    
    // Links on the right side in column - reduced spacing
    links: {
      x: centerX + 500,
      startY: centerY - 250,
      spacing: 150
    }
  };
  
  const updatedNodes = nodes.map(node => {
    // Update origin position
    if (node.id === originNodeId) {
      return { ...node, position: flowLayout.origin };
    }
    
    // Update evolution nodes
    const evolutionIndex = evolutionNodes.indexOf(node.id);
    if (evolutionIndex !== -1) {
      const progress = evolutionNodes.length > 1 ? evolutionIndex / (evolutionNodes.length - 1) : 0;
      const x = flowLayout.evolution.startX + (flowLayout.evolution.endX - flowLayout.evolution.startX) * progress;
      const yOffset = (evolutionIndex % 3 - 1) * 100; // Reduced vertical stagger
      return { ...node, position: { x, y: flowLayout.evolution.y + yOffset } };
    }
    
    // Update claim position
    if (node.id === claimNodeId) {
      return { ...node, position: flowLayout.claim };
    }
    
    // Update belief driver positions in arc
    const beliefIndex = beliefDriverNodes.indexOf(node.id);
    if (beliefIndex !== -1 && beliefDriverNodes.length > 0) {
      const angle = beliefDriverNodes.length === 1 
        ? 0 
        : flowLayout.beliefs.startAngle + (flowLayout.beliefs.endAngle - flowLayout.beliefs.startAngle) * (beliefIndex / (beliefDriverNodes.length - 1));
      const x = flowLayout.beliefs.centerX + Math.cos(angle) * flowLayout.beliefs.radius;
      const y = flowLayout.beliefs.y + Math.sin(angle) * flowLayout.beliefs.radius / 2;
      return { ...node, position: { x, y } };
    }
    
    // Update source positions in arc
    const sourceIndex = sourceNodes.indexOf(node.id);
    if (sourceIndex !== -1 && sourceNodes.length > 0) {
      const angle = sourceNodes.length === 1 
        ? Math.PI / 2 
        : flowLayout.sources.startAngle + (flowLayout.sources.endAngle - flowLayout.sources.startAngle) * (sourceIndex / (sourceNodes.length - 1));
      const x = flowLayout.sources.centerX + Math.cos(angle) * flowLayout.sources.radius;
      const y = flowLayout.sources.y + Math.sin(angle) * flowLayout.sources.radius / 3;
      return { ...node, position: { x, y } };
    }
    
    // Update link positions in column
    const linkIndex = linkNodes.indexOf(node.id);
    if (linkIndex !== -1) {
      return { 
        ...node, 
        position: { 
          x: flowLayout.links.x, 
          y: flowLayout.links.startY + linkIndex * flowLayout.links.spacing 
        } 
      };
    }
    
    return node;
  });
  
  return resolveOverlaps(updatedNodes);
};

export function OriginTracingDiagram({
  originTracing,
  beliefDrivers = [],
  sources = [],
  verdict = 'unverified',
  content = '',
  allLinks = [],
}: OriginTracingDiagramProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;
    
    // Track node IDs for logical flow layout
    let originNodeId: string | null = null;
    const evolutionNodes: string[] = [];
    let claimNodeId = '';
    const beliefDriverNodes: string[] = [];
    const sourceNodes: string[] = [];
    const linkNodes: string[] = [];

    // Calculate total content to fit properly on screen with center claim
    const totalEvolutionSteps = Math.max(
      (originTracing?.firstSeenDates?.length || 0) + 
      (originTracing?.propagationPaths?.length || 0),
      1
    );
    // const hasOrigin = !!originTracing?.hypothesizedOrigin; // Removed unused variable
    const centerX = 1200; // Fixed center position
    const evolutionWidth = Math.min(800, totalEvolutionSteps * 180); // Width for evolution chain
    
    // Define layout for interconnected network with centered claim
    const LAYOUT = {
      // Current claim at center - always centered
      currentClaim: { 
        x: centerX, 
        y: 320 
      },
      
      // Evolution timeline - flows toward center from left
      evolution: {
        startX: centerX - evolutionWidth - 150,
        endX: centerX - 150,
        y: 320,
        stepSpacing: Math.max(150, evolutionWidth / Math.max(totalEvolutionSteps, 1)),
        verticalSpread: 100,
      },
      
      // Belief drivers above center - reduced spacing
      beliefs: { 
        startX: centerX - (Math.min(beliefDrivers.length, 3) * 320) / 2,
        y: 80, 
        spacing: 320,
        maxPerRow: 3
      },
      
      // Sources below center - reduced spacing  
      sources: { 
        startX: centerX - (Math.min(sources.length, 3) * 300) / 2, 
        y: 480, 
        spacing: 300,
        maxPerRow: 3 // Reduce per row to ensure better spacing
      },
      
      // All links at bottom - reduced spacing
      allLinks: {
        startX: centerX - (Math.min(allLinks.length, 4) * 280) / 2,
        y: 650,
        spacing: 280,
        maxPerRow: 4, // Reduce per row to ensure better spacing
      },
      
      // Node dimensions - optimized spacing
      nodeWidth: 260,
      nodeHeight: 110,
      minSpacing: 50,
      
      // Layout bounds
      centerX,
      totalHeight: 750
    };

    // Build chronological evolution chain
    const localEvolutionNodes: string[] = [];
    
    // Step 1: Origin node (if available)
    let previousNodeId: string | null = null;
    if (originTracing?.hypothesizedOrigin) {
      const currentOriginNodeId = `origin-${nodeId++}`;
      originNodeId = currentOriginNodeId;
      nodes.push({
        id: currentOriginNodeId,
        type: 'origin',
        position: { 
          x: LAYOUT.evolution.startX, 
          y: LAYOUT.evolution.y 
        },
        data: { label: originTracing.hypothesizedOrigin },
      });
      localEvolutionNodes.push(currentOriginNodeId);
      previousNodeId = currentOriginNodeId;
    }

    // Step 2: Create evolution chain from first seen dates and propagation paths
    const evolutionSteps: Array<{ label: string; date?: string; platform?: string; impact?: string; type: 'timeline' | 'propagation' | 'evolution' }> = [];
    
    // Combine and sort timeline entries
    if (originTracing?.firstSeenDates) {
      originTracing.firstSeenDates.forEach(dateInfo => {
        evolutionSteps.push({
          label: `${dateInfo.source}${dateInfo.date ? ` (${dateInfo.date})` : ''}`,
          date: dateInfo.date,
          type: 'timeline'
        });
      });
    }

    // Add evolution steps with meaningful transformations
    if (originTracing?.evolutionSteps) {
      originTracing.evolutionSteps.forEach(step => {
        evolutionSteps.push({
          label: step.transformation || `Spread via ${step.platform}`,
          platform: step.platform,
          impact: step.impact,
          date: step.date,
          type: 'evolution'
        });
      });
    }
    
    // Fallback to legacy propagation paths if no evolution steps
    if ((!originTracing?.evolutionSteps || originTracing.evolutionSteps.length === 0) && originTracing?.propagationPaths) {
      originTracing.propagationPaths.forEach(path => {
        evolutionSteps.push({
          label: `Content spread through ${path}`,
          platform: path,
          type: 'propagation'
        });
      });
    }

    // Sort by date if available, otherwise keep original order
    evolutionSteps.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0; // Keep original order if no dates
    });

    // Create interconnected evolution chain
    evolutionSteps.forEach((step, index) => {
      const stepNodeId = `evolution-${nodeId++}`;
      const stepNumber = previousNodeId ? localEvolutionNodes.length : 0;
      
      // Alternate positions to prevent overlaps - use staggered pattern with much more spacing
      const yOffset = (index % 3 === 0) ? 0 : (index % 3 === 1 ? -80 : 80);
      
      nodes.push({
        id: stepNodeId,
        type: step.type === 'timeline' ? 'propagation' : step.type === 'evolution' ? 'evolution' : 'propagation',
        position: { 
          x: LAYOUT.evolution.startX + stepNumber * LAYOUT.evolution.stepSpacing,
          y: LAYOUT.evolution.y + yOffset
        },
        data: { 
          label: step.label,
          platform: step.platform,
          impact: step.impact
        },
      });

      localEvolutionNodes.push(stepNodeId);
      evolutionNodes.push(stepNodeId);

      // Connect to previous node in chain - only for direct sequence to keep it simple
      if (previousNodeId && index < 4) { // Limit connections to first 4 steps to reduce complexity
        edges.push({
          id: `${previousNodeId}-${stepNodeId}`,
          source: previousNodeId,
          sourceHandle: 'right',
          target: stepNodeId,
          targetHandle: 'left',
          type: 'smoothstep',
          animated: index < 2, // Animate fewer connections
          markerEnd: { type: MarkerType.ArrowClosed },
          label: index === 0 ? 'evolves' : '', // Only label first connection
          style: { 
            stroke: step.type === 'timeline' ? '#0066cc' : '#ff8800', 
            strokeWidth: 2,
            opacity: 0.8
          },
        });
      }

      previousNodeId = stepNodeId;
    });

    // Step 3: Current claim at the end of evolution
    const currentClaimNodeId = `claim-${nodeId++}`;
    claimNodeId = currentClaimNodeId;
    nodes.push({
        id: currentClaimNodeId,
      type: 'claim',
      position: { x: LAYOUT.currentClaim.x, y: LAYOUT.currentClaim.y },
      data: { 
        label: extractClaimContent(content, originTracing, beliefDrivers, sources), 
        verdict 
      },
    });

    // Connect final evolution step to current claim
    if (previousNodeId) {
      edges.push({
        id: `${previousNodeId}-${currentClaimNodeId}`,
        source: previousNodeId,
        sourceHandle: 'right',
        target: currentClaimNodeId,
        targetHandle: 'left',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'becomes',
        style: { stroke: '#dc2626', strokeWidth: 3 },
      });
    }

    // Add belief drivers above evolution chain - show how they influence belief molding
    beliefDrivers.forEach((driver, index) => {
      const driverNodeId = `belief-${nodeId++}`;
      beliefDriverNodes.push(driverNodeId);
      const col = index % LAYOUT.beliefs.maxPerRow;
      const row = Math.floor(index / LAYOUT.beliefs.maxPerRow);
      
      // Ensure adequate spacing to prevent overlaps
      const x = LAYOUT.beliefs.startX + col * LAYOUT.beliefs.spacing;
      const y = LAYOUT.beliefs.y - row * 120; // Reduced row spacing
      
      nodes.push({
        id: driverNodeId,
        type: 'beliefDriver',
        position: { x, y },
        data: { 
          name: driver.name, 
          description: driver.description,
          references: driver.references
        },
      });

      // Only connect belief drivers to the final claim to reduce visual complexity
      // No connections to intermediate evolution steps to prevent edge crossings
      edges.push({
        id: `${driverNodeId}-${currentClaimNodeId}`,
        source: driverNodeId,
        sourceHandle: 'bottom',
        target: currentClaimNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: index === 0 ? 'influences belief' : '', // Only label first connection
        style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.8 },
      });
    });

    // Add fact-check sources below evolution chain
    sources.forEach((source, index) => {
      const sourceNodeId = `source-${nodeId++}`;
      sourceNodes.push(sourceNodeId);
      const col = index % LAYOUT.sources.maxPerRow;
      const row = Math.floor(index / LAYOUT.sources.maxPerRow);
      
      nodes.push({
        id: sourceNodeId,
        type: 'source',
        position: { 
          x: LAYOUT.sources.startX + col * LAYOUT.sources.spacing,
          y: LAYOUT.sources.y + row * 130 // Reduced row spacing for multiple rows
        },
        data: { 
          label: source.source || (source.url ? new URL(source.url).hostname.replace(/^www\./, '') : source.title), 
          credibility: source.credibility,
          url: source.url 
        },
      });

      edges.push({
        id: `${currentClaimNodeId}-${sourceNodeId}`,
        source: currentClaimNodeId,
        sourceHandle: 'bottom',
        target: sourceNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'fact-checked by',
        style: { stroke: '#10b981', strokeWidth: 2 },
      });
    });

    // Add all links at bottom - limit and space appropriately
    allLinks.slice(0, 8).forEach((link, index) => { // Limit to 8 for better layout
      const linkNodeId = `alllink-${nodeId++}`;
      linkNodes.push(linkNodeId);
      const col = index % LAYOUT.allLinks.maxPerRow;
      const row = Math.floor(index / LAYOUT.allLinks.maxPerRow);
      
      // Ensure links don't extend beyond layout bounds
      const x = Math.min(
        LAYOUT.allLinks.startX + col * LAYOUT.allLinks.spacing,
        LAYOUT.centerX + 600 - LAYOUT.nodeWidth
      );
      
      nodes.push({
        id: linkNodeId,
        type: 'source',
        position: { 
          x,
          y: LAYOUT.allLinks.y + row * 100 // Reduced row spacing
        },
        data: {
          label: link.title || link.url,
          credibility: computeCredibilityFromUrl(link.url),
          url: link.url,
        },
      });

      // No connections to avoid edge crossing complexity - nodes are positioned to show relationship spatially
    });

    // Apply logical flow layout and overlap resolution
    const optimizedNodes = createLogicalFlow(
      originNodeId,
      evolutionNodes,
      claimNodeId,
      beliefDriverNodes,
      sourceNodes,
      linkNodes,
      nodes
    );
    
    return { nodes: optimizedNodes, edges };
  }, [originTracing, beliefDrivers, sources, verdict, content, allLinks]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(() => {
    // Disable manual connections for this read-only diagram
  }, []);

  if (!originTracing?.hypothesizedOrigin && !beliefDrivers.length && !sources.length) {
    return null;
  }

  return (
    <Card className="w-full h-[600px] p-3 shadow-lg mb-6">
      <div className="h-full">
        <div className="mb-3">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Belief Evolution Network
          </h3>
          <p className="text-xs text-muted-foreground">
            Step-by-step evolution from origin through platforms to current state
          </p>
        </div>
        <div className="h-[calc(100%-3.5rem)] border rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ 
              padding: 0.1, 
              includeHiddenNodes: false,
              minZoom: 0.15,
              maxZoom: 0.6 
            }}
            minZoom={0.15}
            maxZoom={1.2}
            attributionPosition="bottom-left"
            defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
            proOptions={{ hideAttribution: false }}
          >
            <Controls showInteractive={false} />
            <Background gap={15} size={1} color="#f1f5f9" />
          </ReactFlow>
        </div>
      </div>
    </Card>
  );
}