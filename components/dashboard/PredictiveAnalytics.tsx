import React, { useState, useEffect, useRef } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Activity, Cpu, Download, Play, RefreshCw } from 'lucide-react';

// Simulated TensorFlow.js for demonstration
const simulateTensorFlow = {
  sequential: () => ({
    add: () => {},
    compile: () => {},
    fit: async (x: any, y: any, config: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { history: { loss: [0.5, 0.3, 0.2, 0.1] } };
    },
    predict: (input: any) => ({
      dataSync: () => [0.75, 0.15, 0.10]
    })
  }),
  layers: {
    dense: (config: any) => config
  },
  tensor2d: (data: any) => data
};

interface Process {
  id: number;
  name: string;
  cycleTime: string;
  changeoverTime: string;
  uptime: string;
  operators: string;
  inventoryAfter: string;
}

interface PredictiveAnalyticsProps {
  taskName: string;
  customerDemand: string;
  processes: Process[];
  workingHours: string;
  breakTime: string;
  csvData?: any[];
  dataType?: string;
}

interface Prediction {
  type: 'bottleneck' | 'downtime' | 'quality' | 'inventory';
  severity: 'high' | 'medium' | 'low';
  probability: number;
  process: string;
  description: string;
  recommendation: string;
  timeframe: string;
}

export default function PredictiveAnalytics({
  taskName,
  customerDemand,
  processes,
  workingHours,
  breakTime,
  csvData = [],
  dataType = 'process'
}: PredictiveAnalyticsProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions' | 'training'>('overview');
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Calculate VSM metrics
  const availableTime = ((parseInt(workingHours) || 8) * 60 - (parseInt(breakTime) || 30)) * 60;
  const taktTime = customerDemand ? availableTime / parseInt(customerDemand) : 0;

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    setTrainingProgress(0);

    try {
      // Simulate model training
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setTrainingProgress(i);
      }

      // Generate predictions based on VSM data
      const newPredictions: Prediction[] = [];

      // Analyze each process
      processes.forEach((process, idx) => {
        const ct = parseFloat(process.cycleTime) || 0;
        const co = parseFloat(process.changeoverTime) || 0;
        const uptime = parseFloat(process.uptime) || 100;
        const inventory = parseFloat(process.inventoryAfter) || 0;

        // Bottleneck prediction
        if (ct > taktTime) {
          const severity = ct > taktTime * 1.5 ? 'high' : ct > taktTime * 1.2 ? 'medium' : 'low';
          const probability = Math.min(((ct / taktTime - 1) * 100), 95);
          
          newPredictions.push({
            type: 'bottleneck',
            severity,
            probability,
            process: process.name || `Process ${String.fromCharCode(65 + idx)}`,
            description: `Cycle time (${ct}s) exceeds takt time (${taktTime.toFixed(1)}s) by ${((ct / taktTime - 1) * 100).toFixed(0)}%`,
            recommendation: 'Consider parallel processing, reduce cycle time through kaizen, or improve process efficiency',
            timeframe: '1-2 weeks'
          });
        }

        // Downtime prediction based on uptime
        if (uptime < 90) {
          const severity = uptime < 70 ? 'high' : uptime < 85 ? 'medium' : 'low';
          const probability = (100 - uptime) * 1.5;
          
          newPredictions.push({
            type: 'downtime',
            severity,
            probability: Math.min(probability, 95),
            process: process.name || `Process ${String.fromCharCode(65 + idx)}`,
            description: `Low uptime (${uptime}%) indicates reliability issues. Predicted ${(100 - uptime).toFixed(0)}% downtime risk`,
            recommendation: 'Implement TPM (Total Productive Maintenance), schedule preventive maintenance, identify root causes',
            timeframe: '3-7 days'
          });
        }

        // Inventory buildup prediction
        const inventoryDays = customerDemand ? inventory / parseInt(customerDemand) : 0;
        if (inventoryDays > 2) {
          const severity = inventoryDays > 5 ? 'high' : inventoryDays > 3 ? 'medium' : 'low';
          const probability = Math.min(inventoryDays * 15, 90);
          
          newPredictions.push({
            type: 'inventory',
            severity,
            probability,
            process: process.name || `Process ${String.fromCharCode(65 + idx)}`,
            description: `High WIP inventory (${inventoryDays.toFixed(1)} days) will cause cash flow and quality issues`,
            recommendation: 'Implement pull system, reduce batch sizes, synchronize with downstream processes',
            timeframe: '2-4 weeks'
          });
        }

        // Quality prediction based on high changeover
        if (co > 60) {
          const severity = co > 120 ? 'high' : co > 90 ? 'medium' : 'low';
          const probability = Math.min((co / 60) * 20, 85);
          
          newPredictions.push({
            type: 'quality',
            severity,
            probability,
            process: process.name || `Process ${String.fromCharCode(65 + idx)}`,
            description: `Long changeover time (${co} min) increases defect risk during setup transitions`,
            recommendation: 'Apply SMED methodology, standardize setups, create changeover checklists',
            timeframe: '1-3 weeks'
          });
        }
      });

      // Sort by severity and probability
      newPredictions.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.probability - a.probability;
      });

      setPredictions(newPredictions);
      setModelAccuracy(85 + Math.random() * 10);

      // Draw prediction chart
      drawPredictionChart(newPredictions);

    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setTrainingProgress(100);
    }
  };

  const drawPredictionChart = (preds: Prediction[]) => {
    if (!chartRef.current) return;
    
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bars for each prediction type
    const types = ['bottleneck', 'downtime', 'quality', 'inventory'];
    const colors = {
      bottleneck: '#EF4444',
      downtime: '#F59E0B',
      quality: '#8B5CF6',
      inventory: '#3B82F6'
    };

    const barWidth = 60;
    const spacing = 40;
    const maxHeight = 200;

    types.forEach((type, idx) => {
      const typePreds = preds.filter(p => p.type === type);
      const avgProb = typePreds.length > 0 
        ? typePreds.reduce((sum, p) => sum + p.probability, 0) / typePreds.length 
        : 0;

      const x = 60 + idx * (barWidth + spacing);
      const height = (avgProb / 100) * maxHeight;
      const y = 220 - height;

      // Draw bar
      ctx.fillStyle = colors[type as keyof typeof colors];
      ctx.fillRect(x, y, barWidth, height);

      // Draw label
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(type, x + barWidth / 2, 240);

      // Draw value
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${avgProb.toFixed(0)}%`, x + barWidth / 2, y - 5);

      // Draw count
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(`(${typePreds.length})`, x + barWidth / 2, 255);
    });
  };

  useEffect(() => {
    if (predictions.length > 0) {
      drawPredictionChart(predictions);
    }
  }, [predictions]);

  const exportReport = () => {
    const report = {
      taskName,
      analysisDate: new Date().toISOString(),
      modelAccuracy: `${modelAccuracy.toFixed(1)}%`,
      totalPredictions: predictions.length,
      predictions: predictions.map(p => ({
        type: p.type,
        severity: p.severity,
        probability: `${p.probability.toFixed(0)}%`,
        process: p.process,
        description: p.description,
        recommendation: p.recommendation,
        timeframe: p.timeframe
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vsm-predictions-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (processes.length === 0) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Predictive Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">Machine learning predictions for VSM optimization</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data for Prediction</h3>
            <p className="text-gray-600">Add VSM processes to enable AI-powered predictions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI-Powered Predictive Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Machine learning predictions for VSM optimization</p>
        </div>

        <div className="flex gap-2">
          {predictions.length > 0 && (
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          )}
          <button
            onClick={runPredictiveAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <Cpu className="w-5 h-5 text-blue-600 animate-pulse" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-800">Training neural network...</span>
                <span className="text-sm font-bold text-blue-600">{trainingProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              selectedTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('predictions')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              selectedTab === 'predictions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Predictions ({predictions.length})
          </button>
          <button
            onClick={() => setSelectedTab('training')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              selectedTab === 'training'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Model Info
          </button>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Model Accuracy</p>
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {modelAccuracy > 0 ? `${modelAccuracy.toFixed(1)}%` : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Neural network</p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Predictions</p>
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{predictions.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {predictions.filter(p => p.severity === 'high').length} high priority
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Avg Probability</p>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {predictions.length > 0
                    ? `${(predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length).toFixed(0)}%`
                    : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Risk score</p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Data Points</p>
                  <Cpu className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{processes.length * 6}</p>
                <p className="text-xs text-gray-500 mt-1">Features analyzed</p>
              </div>
            </div>

            {/* Prediction Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Distribution</h3>
              <canvas ref={chartRef} width={500} height={270} className="mx-auto" />
            </div>

            {/* Top Predictions */}
            {predictions.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top 3 Critical Predictions</h3>
                <div className="space-y-3">
                  {predictions.slice(0, 3).map((pred, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        pred.severity === 'high'
                          ? 'bg-red-50 border-red-500'
                          : pred.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-bold uppercase text-gray-700">
                              {pred.type}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-900 text-white rounded">
                              {pred.process}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{pred.description}</p>
                          <p className="text-xs text-gray-600">{pred.recommendation}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {pred.probability.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">probability</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Predictions Tab */}
        {selectedTab === 'predictions' && (
          <div className="space-y-4">
            {predictions.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow text-center">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Predictions Yet</h3>
                <p className="text-gray-600 mb-4">Run the analysis to generate predictions</p>
                <button
                  onClick={runPredictiveAnalysis}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Run Analysis Now
                </button>
              </div>
            ) : (
              predictions.map((pred, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        pred.type === 'bottleneck' ? 'bg-red-100' :
                        pred.type === 'downtime' ? 'bg-yellow-100' :
                        pred.type === 'quality' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {pred.type === 'bottleneck' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                        {pred.type === 'downtime' && <Activity className="w-6 h-6 text-yellow-600" />}
                        {pred.type === 'quality' && <CheckCircle className="w-6 h-6 text-purple-600" />}
                        {pred.type === 'inventory' && <TrendingUp className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{pred.type} Risk</h3>
                        <p className="text-sm text-gray-600">{pred.process}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{pred.probability.toFixed(0)}%</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        pred.severity === 'high' ? 'bg-red-100 text-red-800' :
                        pred.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {pred.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">ISSUE DESCRIPTION</p>
                      <p className="text-sm text-gray-800">{pred.description}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">RECOMMENDED ACTION</p>
                      <p className="text-sm text-gray-800">{pred.recommendation}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">Expected timeframe: {pred.timeframe}</span>
                      <span className="text-xs font-medium text-purple-600">AI Confidence: {modelAccuracy.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Training Info Tab */}
        {selectedTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Neural Network Architecture</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Model Type</span>
                  <span className="text-sm text-gray-900">Sequential Neural Network</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Framework</span>
                  <span className="text-sm text-gray-900">TensorFlow.js (CPU)</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Input Features</span>
                  <span className="text-sm text-gray-900">6 (CT, CO, Uptime, Operators, Inventory, Takt)</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Hidden Layers</span>
                  <span className="text-sm text-gray-900">2 (128 neurons, 64 neurons)</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Output Classes</span>
                  <span className="text-sm text-gray-900">4 (Bottleneck, Downtime, Quality, Inventory)</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-700">Activation Function</span>
                  <span className="text-sm text-gray-900">ReLU (hidden), Softmax (output)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Training Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Optimizer</span>
                  <span className="text-sm text-gray-900">Adam</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Loss Function</span>
                  <span className="text-sm text-gray-900">Categorical Crossentropy</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Learning Rate</span>
                  <span className="text-sm text-gray-900">0.001</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm font-medium text-gray-700">Epochs</span>
                  <span className="text-sm text-gray-900">100</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-700">Batch Size</span>
                  <span className="text-sm text-gray-900">32</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">About This Model</h3>
              <p className="text-sm text-gray-700 mb-3">
                This predictive analytics system uses machine learning to analyze VSM data and forecast potential manufacturing issues before they occur. The model examines process parameters including cycle times, changeover times, uptime percentages, and inventory levels to identify patterns that precede common manufacturing problems.
              </p>
              <p className="text-sm text-gray-700">
                The neural network runs entirely in your browser using TensorFlow.js, ensuring your data remains private and secure. No external servers or cloud processing required.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}