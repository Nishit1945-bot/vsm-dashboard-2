// components/dashboard/Dashboard.tsx
'use client';
import Analytics from './Analytics';
import PredictiveAnalytics from './PredictiveAnalytics';
import { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import DataEntryPanel from './DataEntryPanel';
import DataTable from './DataTable';
import VSMPreview from '@/components/vsm/VSMPreview';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Process {
  id: number;
  name: string;
  cycleTime: string;
  changeoverTime: string;
  uptime: string;
  operators: string;
  shifts: string;
  availableTime: string;
  inventoryAfter: string;
  isAutoFilled?: boolean;
}

interface ChatData {
  taskName: string;
  customerDemand: string;
  workingHours: string;
  breakTime: string;
  processes: Process[];
  csvData?: any[];
  dataType?: string;
}

interface DashboardProps {
  projectName: string;
  chatId: string;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  activeTab: 'chat' | 'data' | 'preview' | 'analytics' | 'ai-analytics';
}

const STORAGE_KEY = 'vsm_chat_data';

export default function Dashboard({
  projectName,
  chatId,
  messages,
  isLoading,
  onSendMessage,
  activeTab,
}: DashboardProps) {
  // Load from localStorage on mount
  const [chatDataMap, setChatDataMap] = useState<Record<string, ChatData>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return {};
        }
      }
    }
    return {};
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatDataMap));
    }
  }, [chatDataMap]);

  // Get current chat data or create new empty data
  const currentData = chatDataMap[chatId] || {
    taskName: '',
    customerDemand: '',
    workingHours: '8',
    breakTime: '30',
    processes: [],
    csvData: [],
    dataType: 'process',
  };

  // Update data for current chat
  const updateChatData = (updates: Partial<ChatData>) => {
    setChatDataMap(prev => ({
      ...prev,
      [chatId]: {
        ...currentData,
        ...updates,
      },
    }));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <ChatInterface
            chatId={chatId}
            projectName={projectName}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
          />
        )}

        {activeTab === 'data' && (
          <DataTable
            projectName={projectName}
            taskName={currentData.taskName}
            customerDemand={currentData.customerDemand}
            processes={currentData.processes}
            workingHours={currentData.workingHours}
            breakTime={currentData.breakTime}
            onUpdateProcess={(id, field, value) => {
              const updatedProcesses = currentData.processes.map(p => 
                p.id === id ? { ...p, [field]: value } : p
              );
              updateChatData({ processes: updatedProcesses });
            }}
            onRemoveProcess={(id) => {
              const updatedProcesses = currentData.processes.filter(p => p.id !== id);
              updateChatData({ processes: updatedProcesses });
            }}
          />
        )}

        {activeTab === 'preview' && (
          <VSMPreview
            taskName={currentData.taskName}
            customerDemand={currentData.customerDemand}
            processes={currentData.processes}
            workingHours={currentData.workingHours}
            breakTime={currentData.breakTime}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            taskName={currentData.taskName}
            customerDemand={currentData.customerDemand}
            processes={currentData.processes}
            workingHours={currentData.workingHours}
            breakTime={currentData.breakTime}
          />
        )}

        {activeTab === 'ai-analytics' && (
          <PredictiveAnalytics
            taskName={currentData.taskName}
            customerDemand={currentData.customerDemand}
            processes={currentData.processes}
            workingHours={currentData.workingHours}
            breakTime={currentData.breakTime}
            csvData={currentData.csvData || []}
            dataType={currentData.dataType || 'process'}
          />
        )}
      </div>

      {activeTab === 'chat' && (
        <div className="w-96">
          <DataEntryPanel
            projectName={projectName}
            taskName={currentData.taskName}
            customerDemand={currentData.customerDemand}
            workingHours={currentData.workingHours}
            breakTime={currentData.breakTime}
            processes={currentData.processes}
            onTaskNameChange={(value) => updateChatData({ taskName: value })}
            onCustomerDemandChange={(value) => updateChatData({ customerDemand: value })}
            onWorkingHoursChange={(value) => updateChatData({ workingHours: value })}
            onBreakTimeChange={(value) => updateChatData({ breakTime: value })}
            onProcessesChange={(processes) => updateChatData({ processes })}
            onCsvDataChange={(data, type) => updateChatData({ csvData: data, dataType: type })}
            onDatasetUploaded={(type) => console.log('Dataset uploaded:', type)}
          />
        </div>
      )}
    </div>
  );
}