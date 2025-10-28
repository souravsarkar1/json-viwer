import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from 'reactflow';
import toast from 'react-hot-toast';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';

// Type definitions
interface NodeData {
  label: string;
  type: 'object' | 'array' | 'primitive';
  key: string;
  value: any;
  path: string;
}

interface CustomNode extends Node {
  data: NodeData;
}

interface JsonError {
  message: string;
  line: number;
  column: number;
  position: number;
  context: string;
  suggestion?: string;
}

const JsonTreeVisualizer: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<JsonError | null>(null);

  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(320);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startWidth, setStartWidth] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sample JSON with potential errors for testing
  const sampleJson = `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "address": {
      "city": "New York",
      "country": "USA"
    }
  },
  "items": [
    {
      "name": "item1"
    },
    {
      "name": "item2"
    }
  ]
}`;
  // imagedownload

  const imageWidth = 1024;
  const imageHeight = 768;


  const { getNodes } = useReactFlow();
  const onClick = () => {
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);
    //@ts-ignore
    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#1a365d',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then(downloadImage);
  };

  function downloadImage(dataUrl: any) {
    const a = document.createElement('a');

    a.setAttribute('download', 'reactflow.png');
    a.setAttribute('href', dataUrl);
    a.click();
  }

  // Enhanced JSON error parser
  const parseJsonWithErrorDetails = (jsonString: string): { data?: any; error?: JsonError } => {
    if (!jsonString.trim()) {
      return { error: { message: 'Empty JSON input', line: 1, column: 1, position: 0, context: '' } };
    }

    try {
      const data = JSON.parse(jsonString);
      return { data };
    } catch (error: any) {
      // Extract error details from the native JSON.parse error
      const errorMessage = error.message;
      let line = 1;
      let column = 1;
      let position = 0;
      let suggestion = '';

      // Try to extract position information from different browser error formats
      const positionMatch = errorMessage.match(/position (\d+)/i) ||
        errorMessage.match(/at position (\d+)/i) ||
        errorMessage.match(/at character (\d+)/i);

      if (positionMatch) {
        position = parseInt(positionMatch[1], 10);

        // Calculate line and column from position
        const lines = jsonString.substring(0, position).split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }

      // Get context around the error
      const lines = jsonString.split('\n');
      let context = '';
      if (line <= lines.length) {
        const startLine = Math.max(0, line - 2);
        const endLine = Math.min(lines.length, line + 1);

        context = lines.slice(startLine, endLine)
          .map((l, i) => {
            const lineNum = startLine + i + 1;
            const marker = lineNum === line ? '→' : ' ';
            return `${marker} ${lineNum.toString().padStart(3)}: ${l}`;
          })
          .join('\n');
      }

      // Generate suggestions based on common errors
      if (errorMessage.includes('Unexpected token')) {
        if (errorMessage.includes('"')) {
          suggestion = 'Check for unescaped quotes or missing commas before this string';
        } else if (errorMessage.includes('}')) {
          suggestion = 'Check for missing comma before this closing brace';
        } else if (errorMessage.includes(']')) {
          suggestion = 'Check for missing comma before this closing bracket';
        } else if (errorMessage.includes(',')) {
          suggestion = 'Remove trailing comma or add another property/element';
        }
      } else if (errorMessage.includes('Unexpected end')) {
        suggestion = 'JSON is incomplete - check for missing closing braces } or brackets ]';
      } else if (errorMessage.includes('Expected property name')) {
        suggestion = 'Property names must be strings wrapped in double quotes';
      }

      return {
        error: {
          message: errorMessage,
          line,
          column,
          position,
          context,
          suggestion
        }
      };
    }
  };

  // Real-time JSON validation
  const validateJsonInput = useCallback((input: string) => {
    if (!input.trim()) {
      setJsonError(null);
      return;
    }

    const result = parseJsonWithErrorDetails(input);
    if (result.error) {
      setJsonError(result.error);
    } else {
      setJsonError(null);
    }
  }, []);

  // Update validation when input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateJsonInput(jsonInput);
    }, 300); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [jsonInput, validateJsonInput]);

  // Highlight error line in textarea
  const highlightErrorLine = useCallback(() => {
    if (!jsonError || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const lines = jsonInput.split('\n');
    let charPosition = 0;

    // Calculate character position of the error line
    for (let i = 0; i < jsonError.line - 1; i++) {
      charPosition += lines[i].length + 1; // +1 for newline
    }

    // Set cursor to error position
    textarea.focus();
    textarea.setSelectionRange(charPosition, charPosition + lines[jsonError.line - 1].length);
  }, [jsonError, jsonInput]);

  // Resizing logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(leftPanelWidth);
    e.preventDefault();
  }, [leftPanelWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    const containerWidth = containerRef.current?.offsetWidth || 1200;

    const minWidth = 250;
    const maxWidth = containerWidth * 0.7;

    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setLeftPanelWidth(clampedWidth);
  }, [isResizing, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Node styling
  const getNodeStyle = (nodeType: 'object' | 'array' | 'primitive', isHighlighted: boolean = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '2px solid',
      fontSize: '12px',
      fontWeight: '500',
      minWidth: '60px',
      textAlign: 'center',
    };

    const styles = {
      object: {
        backgroundColor: isHighlighted ? '#3b82f6' : '#e0e7ff',
        borderColor: isHighlighted ? '#1d4ed8' : '#3b82f6',
        color: isHighlighted ? 'white' : '#1e40af',
      },
      array: {
        backgroundColor: isHighlighted ? '#10b981' : '#d1fae5',
        borderColor: isHighlighted ? '#047857' : '#10b981',
        color: isHighlighted ? 'white' : '#047857',
      },
      primitive: {
        backgroundColor: isHighlighted ? '#f59e0b' : '#fef3c7',
        borderColor: isHighlighted ? '#d97706' : '#f59e0b',
        color: isHighlighted ? 'white' : '#d97706',
      },
    };

    return { ...baseStyle, ...styles[nodeType] };
  };

  // Convert JSON to tree
  const convertJsonToTree = useCallback((jsonData: any) => {
    const nodes: CustomNode[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    const traverse = (
      obj: any,
      parentId: string | null = null,
      key: string = 'root',
      path: string = '$',
      level: number = 0
    ): string => {
      const currentId = `node-${nodeId++}`;
      const xOffset = level * 200;
      const yOffset = nodes.filter(n => n.position.x === xOffset).length * 100;

      let nodeType: 'object' | 'array' | 'primitive';
      let label: string;
      let nodeData: NodeData;

      if (Array.isArray(obj)) {
        nodeType = 'array';
        label = `${key}[${obj.length}]`;
        nodeData = { type: 'array', key, value: obj, path, label };
      } else if (obj !== null && typeof obj === 'object') {
        nodeType = 'object';
        label = key === 'root' ? 'root' : key;
        nodeData = { type: 'object', key, value: obj, path, label };
      } else {
        nodeType = 'primitive';
        label = `${key}: ${JSON.stringify(obj)}`;
        nodeData = { type: 'primitive', key, value: obj, path, label };
      }

      nodes.push({
        id: currentId,
        type: 'default',
        position: { x: xOffset, y: yOffset },
        data: nodeData,
        style: getNodeStyle(nodeType),
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'smoothstep',
        });
      }

      if (Array.isArray(obj)) {
        obj.forEach((item: any, index: number) => {
          const childPath = `${path}[${index}]`;
          traverse(item, currentId, index.toString(), childPath, level + 1);
        });
      } else if (obj !== null && typeof obj === 'object') {
        Object.keys(obj).forEach((childKey: string) => {
          const childPath = path === '$' ? `$.${childKey}` : `${path}.${childKey}`;
          traverse(obj[childKey], currentId, childKey, childPath, level + 1);
        });
      }

      return currentId;
    };

    try {
      traverse(jsonData);
      return { nodes, edges };
    } catch (error) {
      console.error('Error converting JSON to tree:', error);
      return { nodes: [], edges: [] };
    }
  }, []);

  // Generate tree with enhanced error handling
  const generateTree = useCallback(() => {
    if (!jsonInput.trim()) {
      toast.error('Please enter JSON data');
      return;
    }

    const result = parseJsonWithErrorDetails(jsonInput);

    if (result.error) {
      setJsonError(result.error);
      toast.error(`JSON Error at line ${result.error.line}: ${result.error.message}`);
      return;
    }

    if (result.data) {
      const { nodes: newNodes, edges: newEdges } = convertJsonToTree(result.data);
      //@ts-ignore
      setNodes(newNodes);
      setEdges(newEdges);
      setHighlightedNodeId(null);
      setJsonError(null);
      toast.success('Tree generated successfully!');
    }
  }, [jsonInput, convertJsonToTree, setNodes, setEdges]);

  // Search functionality
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Please generate a tree first');
      return;
    }

    try {
      const matchingNode = nodes.find((node: any) =>
        node.data.path === searchQuery ||
        node.data.path.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingNode) {
        setHighlightedNodeId(matchingNode.id);

        const updatedNodes = nodes.map((node: any) => ({
          ...node,
          style: getNodeStyle(
            node.data.type,
            node.id === matchingNode.id
          ),
        }));
        setNodes(updatedNodes);

        toast.success('Match found!');
      } else {
        toast.error('No match found');
        setHighlightedNodeId(null);

        const updatedNodes = nodes.map((node: any) => ({
          ...node,
          style: getNodeStyle(node.data.type, false),
        }));
        setNodes(updatedNodes);
      }
    } catch (error) {
      toast.error('Search error');
      console.error('Search error:', error);
    }
  }, [searchQuery, nodes, setNodes]);

  // Clear all
  const clearAll = useCallback(() => {
    setJsonInput('');
    setSearchQuery('');
    setNodes([]);
    setEdges([]);
    setHighlightedNodeId(null);
    setJsonError(null);
    toast.success('Cleared successfully!');
  }, [setNodes, setEdges]);

  // Load sample
  const loadSample = useCallback(() => {
    setJsonInput(sampleJson);
    toast.success('Sample JSON loaded!');
  }, [sampleJson]);

  // Load broken sample for testing error detection
  const loadBrokenSample = useCallback(() => {
    const brokenJson = `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "address": {
      "city": "New York"
      "country": "USA"
    }
  },
  "items": [
    {
      "name": "item1",
    }
  ]
}`;
    setJsonInput(brokenJson);
    toast.success('Broken JSON loaded for testing!');
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => onNodesChange(changes),
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => onEdgesChange(changes),
    [onEdgesChange]
  );

  // Quick resize functions
  const setLeftPanelToNarrow = () => setLeftPanelWidth(250);
  const setLeftPanelToMedium = () => setLeftPanelWidth(400);
  const setLeftPanelToWide = () => setLeftPanelWidth(550);

  return (
    <div
      ref={containerRef}
      className={`w-screen h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 flex-shrink-0`}>
        <div className="w-full flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            JSON Tree Visualizer
          </h1>

          <div className="flex items-center gap-4">
            {/* JSON Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${jsonError
                ? 'bg-red-500'
                : jsonInput.trim() && !jsonError
                  ? 'bg-green-500'
                  : 'bg-gray-400'
                }`}></div>
              <span className={`text-sm ${jsonError
                ? 'text-red-600'
                : jsonInput.trim() && !jsonError
                  ? 'text-green-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {jsonError
                  ? 'Invalid JSON'
                  : jsonInput.trim() && !jsonError
                    ? 'Valid JSON'
                    : 'No JSON'
                }
              </span>
            </div>

            {/*Image Download React Flow*/}

            <button onClick={onClick} className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Download Image
            </button>

            {/* Quick resize buttons */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Panel:
              </span>
              <button
                onClick={setLeftPanelToNarrow}
                className={`px-2 py-1 text-xs rounded ${leftPanelWidth <= 280
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Narrow
              </button>
              <button
                onClick={setLeftPanelToMedium}
                className={`px-2 py-1 text-xs rounded ${leftPanelWidth > 280 && leftPanelWidth <= 480
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Medium
              </button>
              <button
                onClick={setLeftPanelToWide}
                className={`px-2 py-1 text-xs rounded ${leftPanelWidth > 480
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Wide
              </button>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div
          className={`flex-shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}
          style={{ width: leftPanelWidth }}
        >

          {/* JSON Input */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              JSON Input
            </h2>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste or type JSON data here..."
                className={`w-full h-40 p-3 border rounded-lg font-mono text-sm resize-none ${jsonError
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />

              {/* Error indicator overlay */}
              {jsonError && (
                <div className="absolute top-2 right-2">
                  <div className="bg-red-500 text-white p-1 rounded text-xs">
                    Error Line {jsonError.line}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={generateTree}
                disabled={!!jsonError}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${jsonError
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Generate Tree
              </button>
              <button
                onClick={loadSample}
                className={`px-3 py-2 rounded-lg transition-colors font-medium text-sm ${isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Sample
              </button>
              <button
                onClick={loadBrokenSample}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                Test
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Error Display */}
          {jsonError && (
            <div className="mx-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-red-500 mt-1">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-red-800 dark:text-red-200 font-semibold text-sm mb-2">
                    JSON Syntax Error
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-red-700 dark:text-red-300 font-medium">Error:</span>
                      <span className="text-red-600 dark:text-red-400 ml-1">{jsonError.message}</span>
                    </div>

                    <div>
                      <span className="text-red-700 dark:text-red-300 font-medium">Location:</span>
                      <span className="text-red-600 dark:text-red-400 ml-1">
                        Line {jsonError.line}, Column {jsonError.column}
                      </span>
                    </div>

                    {jsonError.suggestion && (
                      <div>
                        <span className="text-red-700 dark:text-red-300 font-medium">Suggestion:</span>
                        <span className="text-red-600 dark:text-red-400 ml-1">{jsonError.suggestion}</span>
                      </div>
                    )}
                  </div>

                  {jsonError.context && (
                    <div className="mt-3">
                      <div className="text-red-700 dark:text-red-300 font-medium text-xs mb-1">Context:</div>
                      <pre className="text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded border overflow-x-auto">
                        <code className="text-red-800 dark:text-red-200">{jsonError.context}</code>
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={highlightErrorLine}
                    className="mt-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    Jump to Error
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Search
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="$.user.address.city"
                className={`w-full p-3 border rounded-lg ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />

              <button
                onClick={handleSearch}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Legend & Instructions */}
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Validation Status */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Validation Status
              </h3>
              <div className={`text-sm p-3 rounded-lg ${jsonError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : jsonInput.trim() && !jsonError
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                }`}>
                {jsonError
                  ? `❌ Invalid JSON (Line ${jsonError.line})`
                  : jsonInput.trim() && !jsonError
                    ? '✅ Valid JSON ready for parsing'
                    : '⏳ Waiting for JSON input'
                }
              </div>
            </div>

            {/* Legend */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Node Types
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e0e7ff', border: '1px solid #3b82f6' }}></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Objects</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981' }}></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Arrays</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Primitives</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Instructions
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. Input JSON</h4>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Real-time validation shows errors with exact line/column location.
                  </p>
                </div>

                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. Fix Errors</h4>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Click "Jump to Error" to navigate directly to problematic code.
                  </p>
                </div>

                <div>
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. Generate Tree</h4>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Button is disabled until JSON is valid.
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Common Errors:
                  </h4>
                  <ul className={`space-y-1 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li>• Missing commas between properties</li>
                    <li>• Trailing commas before{`}`}or {`]`}</li>
                    <li>• Unescaped quotes in strings</li>
                    <li>• Missing closing braces or brackets</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div
          ref={resizerRef}
          className={`w-1 cursor-col-resize flex-shrink-0 transition-colors duration-200 ${isResizing
            ? 'bg-blue-500'
            : isDarkMode
              ? 'bg-gray-600 hover:bg-gray-500'
              : 'bg-gray-300 hover:bg-gray-400'
            }`}
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full relative">
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${isResizing
              ? 'bg-blue-400'
              : isDarkMode
                ? 'bg-gray-500'
                : 'bg-gray-400'
              }`}></div>
          </div>
        </div>

        {/* Right Panel - Tree Visualization */}
        <div className="flex-1 flex flex-col">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} flex-1`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-left"
              className="w-full h-full"
            >
              <Controls className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
              <MiniMap className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
              <Background gap={12} size={1} color={isDarkMode ? '#374151' : '#e5e7eb'} />

              <Panel position="top-left" className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded shadow border`}>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {nodes.length > 0 ? `${nodes.length} nodes` : 'No tree generated'}
                </div>
                {highlightedNodeId && (
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Node highlighted
                  </div>
                )}
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonTreeVisualizer;