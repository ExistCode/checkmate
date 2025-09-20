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
}

interface BeliefDriver {
  name: string;
  description: string;
  references?: Array<{ title: string; url: string }>;
}

interface FactCheckSource {
  url: string;
  title: string;
  credibility: number;
}

interface OriginTracingDiagramProps {
  originTracing?: OriginTracingData;
  beliefDrivers?: BeliefDriver[];
  sources?: FactCheckSource[];
  verdict?: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
  content?: string;
}

// Custom node components
interface NodeData {
  label: string;
  verdict?: string;
  credibility?: number;
  url?: string;
  name?: string;
  description?: string;
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
        {getPlatformIcon(data.label)}
      </div>
      <div className="font-semibold text-orange-900 text-sm">Propagation</div>
    </div>
    <div className="text-sm text-orange-800 leading-relaxed">{data.label}</div>
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
  <div className="px-5 py-4 bg-violet-50 border-2 border-violet-200 rounded-xl shadow-lg min-w-[220px] max-w-[320px]">
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
    <div className="text-xs text-violet-700 leading-relaxed">{data.description}</div>
  </div>
);

const nodeTypes = {
  origin: OriginNode,
  propagation: PropagationNode,
  claim: ClaimNode,
  source: SourceNode,
  beliefDriver: BeliefDriverNode,
};

export function OriginTracingDiagram({
  originTracing,
  beliefDrivers = [],
  sources = [],
  verdict = 'unverified',
  content = '',
}: OriginTracingDiagramProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    // Define layout constants with completely separate sections and guaranteed spacing
    const LAYOUT = {
      // Main claim at center - locked position
      center: { x: 1000, y: 600 },
      
      // Origin section (top center) - above claim
      origin: { x: 1000, y: 150 },
      
      // Timeline section (left side) - well separated from center
      timeline: { 
        startX: 100, 
        y: 300, 
        spacing: 320,
        maxPerRow: 3,
        rowSpacing: 150
      },
      
      // Propagation section (right side) - well separated from center
      propagation: { 
        startX: 1500, 
        y: 300, 
        spacing: 320,
        maxPerRow: 3,
        rowSpacing: 150
      },
      
      // Sources section (bottom center) - below claim with good spacing
      sources: { 
        startX: 600, 
        y: 950, 
        spacing: 380,
        maxPerRow: 4,
        rowSpacing: 150
      },
      
      // Belief drivers section (far right) - isolated from other sections
      beliefs: { 
        x: 2000, 
        startY: 400, 
        spacing: 180
      },
      
      // Node dimensions for overlap prevention
      nodeWidth: 300,
      nodeHeight: 140,
      minSpacing: 50 // Minimum gap between nodes
    };

    // Create the central claim node
    const claimNodeId = `claim-${nodeId++}`;
    nodes.push({
      id: claimNodeId,
      type: 'claim',
      position: { x: LAYOUT.center.x, y: LAYOUT.center.y },
      data: { 
        label: content || 'Current Claim', 
        verdict 
      },
    });

    // Add origin node if available
    if (originTracing?.hypothesizedOrigin) {
      const originNodeId = `origin-${nodeId++}`;
      nodes.push({
        id: originNodeId,
        type: 'origin',
        position: { x: LAYOUT.origin.x, y: LAYOUT.origin.y },
        data: { label: originTracing.hypothesizedOrigin },
      });

      edges.push({
        id: `${originNodeId}-${claimNodeId}`,
        source: originNodeId,
        sourceHandle: 'bottom',
        target: claimNodeId,
        targetHandle: 'top',
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'evolved into',
        style: { stroke: '#0066cc', strokeWidth: 2 },
      });
    }

    // Add first seen dates as timeline nodes in left section
    if (originTracing?.firstSeenDates && originTracing.firstSeenDates.length > 0) {
      originTracing.firstSeenDates.forEach((dateInfo, index) => {
        const dateNodeId = `date-${nodeId++}`;
        const row = Math.floor(index / LAYOUT.timeline.maxPerRow);
        const col = index % LAYOUT.timeline.maxPerRow;
        const x = LAYOUT.timeline.startX + col * LAYOUT.timeline.spacing;
        const y = LAYOUT.timeline.y + row * LAYOUT.timeline.rowSpacing;
        
        nodes.push({
          id: dateNodeId,
          type: 'propagation',
          position: { x, y },
          data: { 
            label: `${dateInfo.source}${dateInfo.date ? ` (${dateInfo.date})` : ''}` 
          },
        });

        edges.push({
          id: `${dateNodeId}-${claimNodeId}`,
          source: dateNodeId,
          sourceHandle: 'right',
          target: claimNodeId,
          targetHandle: 'left',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#666', strokeDasharray: '5,5', strokeWidth: 1.5 },
          label: 'timeline',
        });
      });
    }

    // Add propagation path nodes in right section
    if (originTracing?.propagationPaths && originTracing.propagationPaths.length > 0) {
      originTracing.propagationPaths.forEach((path, index) => {
        const propNodeId = `prop-${nodeId++}`;
        const row = Math.floor(index / LAYOUT.propagation.maxPerRow);
        const col = index % LAYOUT.propagation.maxPerRow;
        const x = LAYOUT.propagation.startX + col * LAYOUT.propagation.spacing;
        const y = LAYOUT.propagation.y + row * LAYOUT.propagation.rowSpacing;
        
        nodes.push({
          id: propNodeId,
          type: 'propagation',
          position: { x, y },
          data: { label: path },
        });

        edges.push({
          id: `${propNodeId}-${claimNodeId}`,
          source: propNodeId,
          sourceHandle: 'left',
          target: claimNodeId,
          targetHandle: 'right',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#ff8800', strokeWidth: 2 },
        });
      });
    }

    // Add fact-check source nodes in bottom section
    if (sources.length > 0) {
      sources.forEach((source, index) => {
        const sourceNodeId = `source-${nodeId++}`;
        const row = Math.floor(index / LAYOUT.sources.maxPerRow);
        const col = index % LAYOUT.sources.maxPerRow;
        const x = LAYOUT.sources.startX + col * LAYOUT.sources.spacing;
        const y = LAYOUT.sources.y + row * LAYOUT.sources.rowSpacing;
        
        nodes.push({
          id: sourceNodeId,
          type: 'source',
          position: { x, y },
          data: { 
            label: source.title, 
            credibility: source.credibility,
            url: source.url 
          },
        });

        edges.push({
          id: `${claimNodeId}-${sourceNodeId}`,
          source: claimNodeId,
          sourceHandle: 'bottom',
          target: sourceNodeId,
          targetHandle: 'top',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          label: 'fact-checked by',
          style: { stroke: '#10b981', strokeWidth: 2 },
        });
      });
    }

    // Add belief driver nodes in far right section
    beliefDrivers.forEach((driver, index) => {
      const driverNodeId = `belief-${nodeId++}`;
      const yPosition = LAYOUT.beliefs.startY + index * LAYOUT.beliefs.spacing;
      
      nodes.push({
        id: driverNodeId,
        type: 'beliefDriver',
        position: { x: LAYOUT.beliefs.x, y: yPosition },
        data: { 
          name: driver.name, 
          description: driver.description 
        },
      });

      edges.push({
        id: `${claimNodeId}-${driverNodeId}`,
        source: claimNodeId,
        sourceHandle: 'right',
        target: driverNodeId,
        targetHandle: 'left',
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        label: 'reinforced by',
        style: { stroke: '#8b5cf6', strokeWidth: 2 },
      });
    });

    return { nodes, edges };
  }, [originTracing, beliefDrivers, sources, verdict, content]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(() => {
    // Disable manual connections for this read-only diagram
  }, []);

  if (!originTracing?.hypothesizedOrigin && !beliefDrivers.length && !sources.length) {
    return null;
  }

  return (
    <Card className="w-full h-[1000px] p-6 shadow-xl">
      <div className="h-full">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Information Flow & Origin Tracing
          </h3>
          <p className="text-sm text-muted-foreground">
            Interactive visualization showing how misinformation spreads and evolves from source to current claim
          </p>
        </div>
        <div className="h-[calc(100%-5rem)] border-2 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1, includeHiddenNodes: false }}
            minZoom={0.1}
            maxZoom={1.0}
            attributionPosition="bottom-left"
            defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
            proOptions={{ hideAttribution: false }}
          >
            <Controls showInteractive={false} />
            <Background gap={20} size={1} color="#f1f5f9" />
          </ReactFlow>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <Brain className="h-3 w-3" />
          This diagram shows how information originated, spread across platforms, and the psychological factors that influence belief.
        </div>
      </div>
    </Card>
  );
}