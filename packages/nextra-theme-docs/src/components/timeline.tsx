import { ReactElement, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import cn from 'clsx'

interface TimelineEntry {
  id: string
  timestamp: string
  event: string
  data: {
    file: string
    state: string
    content?: string
    oldContent?: string
    newContent?: string
    timestamp: number
  }
}

interface TimelineProps {
  filePath: string
}

export function Timeline({ filePath }: TimelineProps): ReactElement {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [backendConnected, setBackendConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxReconnectAttempts = 3
  const POLLING_INTERVAL = 500; // 500ms = 0.5 seconds

  // Add sample data for when backend is not available
  const sampleEntries: TimelineEntry[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      event: 'fileStateUpdate',
      data: {
        file: 'example.md',
        state: 'pending',
        timestamp: Date.now()
      }
    }
    // Add more sample entries as needed
  ]

  useEffect(() => {
    let socketInstance: Socket | null = null;
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

        socketInstance = io('http://localhost:5001', {
          path: '/socket.io/',
          transports: ['websocket', 'polling'],
          auth: {
            key: process.env.NEXT_PUBLIC_BACKEND_WS_KEY,
          },
          withCredentials: false,
        });

        // Enhanced connection logging
        socketInstance.on('connect', () => {
          console.log('✅ Connected to backend Socket.IO server', {
            transport: socketInstance?.io?.engine?.transport?.name || 'unknown'
          });
          setBackendConnected(true);
          setConnectionError(null);
          setConnectionAttempts(0);
        });

        // More detailed error handling
        socketInstance.on('connect_error', (error) => {
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
                socketInstance?.close();
                socketInstance = null;
              } else {
                setConnectionError(`Connection attempt ${newCount}/${maxReconnectAttempts}`);
              }
              return newCount;
            });
          }
          setBackendConnected(false);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('❌ Disconnected from backend Socket.IO server. Reason:', reason)
          setBackendConnected(false)
        })

        socketInstance.on('error', (error) => {
          console.error('Socket error:', error)
          setConnectionError(`Socket error: ${error}`)
        })

        // Set up event listeners
        const events = ['fileStateUpdate', 'contentUpdate', 'blockApproved', 'blockRejected', 'fileApproved', 'allFilesProcessed']
        if (socketInstance) {
          events.forEach(event => {
            socketInstance.on(event, (data) => {
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
        socketInstance = null;
      }
    };
  }, []);

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
      default: return '_bg-gray-100 _text-gray-800'
    }
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
        <div className="_text-gray-500 _text-sm _mb-4">
          <span className="_inline-block _w-2 _h-2 _bg-gray-500 _rounded-full _mr-2"></span>
          Documentation is up to date
        </div>
      )}
      
      {entries.length === 0 && (
        <div className="_text-gray-500 _text-sm">No updates available yet.</div>
      )}

      <div className="_space-y-4">
        {entries.map(entry => (
          <div 
            key={entry.id}
            className="_border-l-2 _border-gray-200 _pl-4 _py-2"
          >
            <div className="_flex _items-center _gap-2">
              <span className="_text-sm _text-gray-500">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              <span className={cn(
                '_px-2 _py-0.5 _rounded-full _text-xs',
                getEventColor(entry.event)
              )}>
                {getEventLabel(entry.event)}
              </span>
            </div>

            <div className="_mt-2 _space-y-1">
              {entry.data.file && (
                <div className="_flex _items-center _gap-2 _text-sm">
                  <span className={cn(
                    '_w-16',
                    entry.data.state === 'complete' && '_text-green-600',
                    entry.data.state === 'generating' && '_text-blue-600',
                    entry.data.state === 'showing diff edits' && '_text-yellow-600',
                    entry.data.state === 'all diffs resolved' && '_text-green-600',
                    '_text-gray-600'
                  )}>
                    {entry.data.state}
                  </span>
                  <span className="_text-gray-600">{entry.data.file}</span>
                </div>
              )}
              {entry.data.content && (
                <div className="_flex _items-center _gap-2 _text-sm">
                  <span className="_text-gray-600">Content Change</span>
                  <span className="_text-gray-600">{entry.data.content}</span>
                </div>
              )}
              {entry.data.oldContent && (
                <div className="_flex _items-center _gap-2 _text-sm">
                  <span className="_text-gray-600">Old Content</span>
                  <span className="_text-gray-600">{entry.data.oldContent}</span>
                </div>
              )}
              {entry.data.newContent && (
                <div className="_flex _items-center _gap-2 _text-sm">
                  <span className="_text-gray-600">New Content</span>
                  <span className="_text-gray-600">{entry.data.newContent}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}