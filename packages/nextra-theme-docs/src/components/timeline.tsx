import { ReactElement, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import cn from 'clsx'
import { LoadingDots } from './loading-dots'

interface TimelineEntry {
  id: string
  timestamp: string
  event: string
  data: {
    file: string
    svFile?: string
    state: string
    content?: string
    oldContent?: string
    newContent?: string
    timestamp: number
    autoMerged?: boolean
    generationType: 'gen' | 'autogen'
  }
}

interface TimelineProps {
  filePath: string
}

export function Timeline({ filePath }: TimelineProps): ReactElement {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileList, setFileList] = useState<Array<{
    path: string
    displayName: string
    svFile: string | null
    state: string
    modifiedTime: number
    generationType: 'gen' | 'autogen'
  }>>([])
  const [backendConnected, setBackendConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxReconnectAttempts = 3
  const POLLING_INTERVAL = 500; // 500ms = 0.5 seconds

  // Add socket instance to component state
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  // Add sample data for when backend is not available
  const sampleEntries: TimelineEntry[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      event: 'fileStateUpdate',
      data: {
        file: 'example.md',
        state: 'pending',
        timestamp: Date.now(),
        generationType: 'gen'
      }
    }
    // Add more sample entries as needed
  ]

  // Add state for tracking file-level approval status
  const [fileApprovals, setFileApprovals] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let isConnecting = false;
    let pollingInterval: NodeJS.Timeout | null = null;

    const connectToBackend = async () => {
      if (isConnecting || socketInstance?.connected) return;

      try {
        isConnecting = true;

        let serverCheck;
        try {
          serverCheck = await fetch('http://localhost:5001/health', {
            method: 'GET',
            credentials: 'include'
          });

          // If we get here, server is up - clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }

        } catch (error) {
          console.log('Backend not available, will retry...');
          setConnectionError('AI generation service not available - retrying connection...');
          setBackendConnected(false);
          setEntries(sampleEntries);
          isConnecting = false;
          return;
        }

        if (!serverCheck) {
          setConnectionError('AI generation service not available - connection failed');
          setBackendConnected(false);
          setEntries(sampleEntries);
          return;
        }
        
        if (serverCheck.status === 403) {
          setConnectionError('Authentication failed - please check your API key');
          setBackendConnected(false);
          setEntries(sampleEntries);
          return;
        }

        if (!serverCheck.ok) {
          setConnectionError(`Server error: ${serverCheck.status}`);
          setBackendConnected(false);
          setEntries(sampleEntries);
          return;
        }

        const socket = io('http://localhost:5001', {
          path: '/socket.io/',
          transports: ['websocket', 'polling'],
          auth: {
            key: process.env.NEXT_PUBLIC_BACKEND_WS_KEY,
          },
          withCredentials: false,
        });

        // Store socket instance in state
        setSocketInstance(socket);

        // Update event listeners to use socket directly
        socket.on('connect', () => {
          console.log('✅ Connected to backend Socket.IO server', {
            transport: socket?.io?.engine?.transport?.name || 'unknown'
          });
          setBackendConnected(true);
          setConnectionError(null);
          setConnectionAttempts(0);
        });

        // More detailed error handling
        socket.on('connect_error', (error) => {
          console.error('Connection error details:', {
            message: error.message,
            name: error.name,
            description: error.description
          });
          
          if (error.message.includes('auth')) {
            setConnectionError('Authentication failed - please check your API key');
          } else {
            setConnectionAttempts(prev => {
              const newCount = prev + 1;
              if (newCount >= maxReconnectAttempts) {
                setConnectionError('Unable to connect to backend service. Please try again later.');
                socket?.close();
                setSocketInstance(null);
              } else {
                setConnectionError(`Connection attempt ${newCount}/${maxReconnectAttempts}`);
              }
              return newCount;
            });
          }
          setBackendConnected(false);
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected from backend Socket.IO server. Reason:', reason)
          setBackendConnected(false)
        })

        socket.on('error', (error) => {
          console.error('Socket error:', error)
          setConnectionError(`Socket error: ${error}`)
        })

        // Set up event listeners
        const events = ['fileStateUpdate', 'contentUpdate', 'blockApproved', 'blockRejected', 'fileApproved', 'allFilesProcessed']
        if (socket) {
          events.forEach(event => {
            socket.on(event, (data) => {
              console.log(`📩 Received ${event} event:`, data)
              try {
                // Validate required data fields
                if (!data || !data.file) {
                  console.error(`Invalid data received for ${event}:`, data)
                  return
                }

                setEntries(prev => {
                  console.log(`Adding new entry for ${event}`)
                  return [...prev, {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    event,
                    data
                  }]
                })
              } catch (error) {
                console.error(`Error processing ${event} event:`, error)
              }
            })
          })
        }

      } finally {
        isConnecting = false;
      }
    };

    // Initial connection attempt
    connectToBackend();

    // Start polling if initial connection fails
    pollingInterval = setInterval(() => {
      if (!socketInstance?.connected) {
        connectToBackend();
      }
    }, POLLING_INTERVAL);

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (socketInstance) {
        socketInstance.disconnect();
        setSocketInstance(null);
      }
    };
  }, []);

  // Update the other useEffect hooks to use socketInstance from state
  useEffect(() => {
    if (!socketInstance) return;
    
    socketInstance.on('initialFileList', (data) => {
      console.log('📩 Received initial file list:', data);
      setFileList(data.files);
    });

    return () => {
      socketInstance.off('initialFileList');
    };
  }, [socketInstance]);

  useEffect(() => {
    if (!socketInstance) return;
    
    socketInstance.on('fileGenerationStatus', (data) => {
      console.log('📩 Received generation status:', data);
      setFileList(prevFiles => 
        prevFiles.map(file => 
          file.path === data.file 
            ? { ...file, state: data.state }
            : file
        )
      );
    });

    return () => {
      socketInstance.off('fileGenerationStatus');
    };
  }, [socketInstance]);

  // New function to handle file selection
  const handleFileSelect = (path: string) => {
    setSelectedFile(selectedFile === path ? null : path)
  }

  const getEventLabel = (event: string) => {
    switch (event) {
      case 'fileStateUpdate': return 'State Update'
      case 'contentUpdate': return 'Content Change'
      case 'blockApproved': return 'Block Approved'
      case 'blockRejected': return 'Block Rejected'
      case 'fileApproved': return 'File Approved'
      case 'allFilesProcessed': return 'Processing Complete'
      default: return event
    }
  }

  const getEventColor = (event: string) => {
    switch (event) {
      case 'fileStateUpdate': return '_bg-blue-100 _text-blue-800'
      case 'contentUpdate': return '_bg-yellow-100 _text-yellow-800'
      case 'blockApproved': return '_bg-green-100 _text-green-800'
      case 'blockRejected': return '_bg-red-100 _text-red-800'
      case 'fileApproved': return '_bg-green-100 _text-green-800'
      case 'allFilesProcessed': return '_bg-purple-100 _text-purple-800'
      default: return '_bg-neutral-100 _text-neutral-800'
    }
  }

  // Helper function to handle individual block approval
  const handleBlockApproval = (entryId: string, approved: boolean) => {
    // Handle the approval/rejection of individual blocks
    console.log(`Block ${entryId} ${approved ? 'approved' : 'rejected'}`)
    // TODO: Implement backend communication for block approval
  }

  // Helper function to handle file-level approval
  const handleFileApproval = (filePath: string, approved: boolean) => {
    setFileApprovals(prev => ({
      ...prev,
      [filePath]: approved
    }))
    // TODO: Implement backend communication for file approval
  }

  // Modified status indicator to include generation type
  const getStatusIndicator = (state: string, generationType?: 'gen' | 'autogen') => {
    const baseStatus = {
      generating: {
        containerClass: '_bg-blue-100 _text-blue-800 _animate-pulse',
        icon: (
          <svg className="_animate-spin _h-4 _w-4 _mr-2" viewBox="0 0 24 24">
            <circle 
              className="_opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="_opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ),
        text: 'Generating'
      },
      complete: {
        containerClass: '_bg-green-100 _text-green-800',
        icon: (
          <svg className="_h-4 _w-4 _mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        ),
        text: generationType === 'autogen' ? 'Auto-merged' : 'Ready to merge'
      }
    }[state] || {
      containerClass: '_bg-neutral-100 _text-neutral-800',
      icon: null,
      text: 'Pending'
    }

    // Add additional styling for autogen
    if (generationType === 'autogen' && state === 'complete') {
      baseStatus.containerClass += ' _border-green-500 _border'
    }

    return baseStatus
  }

  return (
    <div className="_px-4 _py-2">
      <h3 className="_font-semibold _mb-4">Documentation Changes</h3>
      
      {connectionError ? (
        <div className="_text-red-500 _text-sm _mb-4">
          <span className="_inline-block _w-2 _h-2 _bg-red-500 _rounded-full _mr-2"></span>
          {connectionError}
        </div>
      ) : backendConnected ? (
        <div className="_text-emerald-500 _text-sm _mb-4">
          <span className="_inline-block _w-2 _h-2 _bg-emerald-500 _rounded-full _mr-2"></span>
          Generating documentation updates...
        </div>
      ) : (
        <div className="_text-neutral-500 _text-sm _mb-4">
          <span className="_inline-block _w-2 _h-2 _bg-neutral-500 _rounded-full _mr-2"></span>
          Documentation is up to date
        </div>
      )}
      
      {entries.length === 0 && (
        <div className="_text-neutral-500 _text-sm">No updates available yet.</div>
      )}

      {/* Modified file list with dropdown styling */}
      <div className="_space-y-0 _mb-4">
        {fileList.map(file => {
          const isAutogen = file.generationType === 'autogen'
          const isComplete = file.state === 'complete'
          const isGenerating = file.state === 'generating'
          
          return (
            <div key={file.path} className="_w-full">
              <div
                onClick={() => handleFileSelect(file.path)}
                className={cn(
                  '_w-full _px-4 _py-3',
                  '_flex _items-center _justify-between',
                  '_border-t _border-x border-black/10 dark:_border-neutral-800',
                  '_cursor-pointer hover:_bg-neutral-50 dark:hover:_bg-neutral-900',
                  selectedFile === file.path ? '_font-medium' : '_text-neutral-700 dark:_text-neutral-400'
                )}
              >
                <div className="_flex-1 _flex _items-center">
                  {/* Dropdown arrow */}
                  <svg
                    className={cn(
                      "_h-3 _w-3 _mr-2 _transition-transform",
                      selectedFile === file.path ? "_rotate-90" : ""
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{file.displayName}</span>
                  
                  {/* Status indicators */}
                  {isComplete && isAutogen && (
                    <svg className="_h-5 _w-5 _ml-2 _text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                
                {/* Right side actions */}
                <div className="_flex _items-center _space-x-2">
                  {isGenerating && (
                    <LoadingDots className="_mr-2" />
                  )}
                  
                  {isComplete && !isAutogen && (
                    <div className="_flex _items-center _space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileApproval(file.path, true);
                        }}
                        className="_px-1.5 _py-0.5 hover:_bg-white/20 _text-green-500 _rounded _text-xs _flex _items-center _whitespace-nowrap"
                      >
                        <svg className="_h-3 _w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span className="_ml-0.5 _hidden sm:_inline">Accept</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileApproval(file.path, false);
                        }}
                        className="_px-1.5 _py-0.5 hover:_bg-white/20 _text-red-500 _rounded _text-xs _flex _items-center _whitespace-nowrap"
                      >
                        <svg className="_h-3 _w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                        <span className="_ml-0.5 _hidden sm:_inline">Reject</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Existing status indicators for generating/pending states */}
                </div>
              </div>

              {/* Content area with border that extends to bottom */}
              {selectedFile === file.path && (
                <div className="_border-x _border-b border-black/10 dark:_border-neutral-800">
                  {/* Existing content display code */}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}