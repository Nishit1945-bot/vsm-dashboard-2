// app/api/ai-analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Process {
  name: string;
  cycleTime: string;
  changeoverTime: string;
  uptime: string;
  operators: string;
  inventoryAfter: string;
}

interface VSMPlotData {
  processes: Array<{
    name: string;
    x: number;
    y: number;
    cycleTime: number;
    uptime: number;
    changeoverTime: number;
    operators: number;
  }>;
  flows: Array<{
    from: string;
    to: string;
    inventory: number;
    days: number;
  }>;
  metrics: {
    totalLeadTime: number;
    totalCycleTime: number;
    taktTime: number;
    valueAddedRatio: number;
  };
  coordinates: {
    supplier: { x: number; y: number };
    customer: { x: number; y: number };
    productionControl: { x: number; y: number };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { processes, customerDemand, workingHours, breakTime } = await request.json();

    if (!processes || processes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No processes provided' },
        { status: 400 }
      );
    }

    console.log('Calling Qwen2.5-3B to generate VSM plot data...');

    // Calculate metrics
    const availableTime = (parseFloat(workingHours) * 3600 - parseFloat(breakTime) * 60);
    const taktTime = availableTime / parseFloat(customerDemand);

    // Build structured prompt for Qwen
    const plotPrompt = buildQwenPlotPrompt(processes, customerDemand, taktTime);

    let llmPlotData: VSMPlotData | null = null;
    let usingAI = false;

    // Step 1: Call Qwen2.5-3B (nishit1945/VSM-LLM-3B-Fast) on HuggingFace
    try {
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/nishit1945/VSM-LLM-3B-Fast',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: plotPrompt,
            parameters: {
              max_new_tokens: 600,
              temperature: 0.1,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false,
              stop: ["</json>", "```", "\n\n\n"]
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        let rawOutput = '';
        
        if (Array.isArray(data)) {
          rawOutput = data[0]?.generated_text || '';
        } else if (data.generated_text) {
          rawOutput = data.generated_text;
        }

        // Extract JSON from output
        llmPlotData = extractJSON(rawOutput);
        
        if (llmPlotData) {
          console.log('LLM generated plot data successfully');
          usingAI = true;
        }
      } else {
        console.log('HuggingFace API error:', response.status);
      }
    } catch (error) {
      console.log('LLM call failed:', error);
    }

    // Step 2: Validate and fix with rule-based logic
    const validatedPlotData = validateAndFixPlotData(
      llmPlotData,
      processes,
      customerDemand,
      taktTime
    );

    // Step 3: Generate text analysis
    const analysis = generateAnalysisText(validatedPlotData, processes, taktTime);

    // Step 4: Generate ASCII diagram from validated data
    const asciiDiagram = generateASCIIDiagram(validatedPlotData);

    return NextResponse.json({ 
      success: true,
      plotData: validatedPlotData,
      vsmDiagram: asciiDiagram,
      analysis: analysis,
      model: usingAI ? 'Qwen2.5-3B (nishit1945/VSM-LLM-3B-Fast)' : 'Rule-based (AI unavailable)',
      isAIGenerated: usingAI,
      validation: {
        wasFixed: llmPlotData !== null && JSON.stringify(llmPlotData) !== JSON.stringify(validatedPlotData),
        source: usingAI ? 'ai-validated' : 'rule-based'
      }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'VSM generation failed' },
      { status: 500 }
    );
  }
}

// Build prompt for Qwen2.5-3B
function buildQwenPlotPrompt(
  processes: Process[], 
  demand: string, 
  taktTime: number
): string {
  const processData = processes.map((p, i) => ({
    index: i + 1,
    name: p.name,
    cycleTime: parseFloat(p.cycleTime),
    changeoverTime: parseFloat(p.changeoverTime),
    uptime: parseFloat(p.uptime),
    operators: parseInt(p.operators),
    inventoryAfter: parseFloat(p.inventoryAfter)
  }));

  return `You are a VSM expert. Generate a JSON structure for plotting a Value Stream Map.

INPUT DATA:
${JSON.stringify(processData, null, 2)}

Customer Demand: ${demand} units/day
Takt Time: ${taktTime.toFixed(2)} seconds

OUTPUT FORMAT (JSON only, no explanation):
{
  "processes": [
    {"name": "Process1", "x": 150, "y": 300, "cycleTime": 30, "uptime": 85, "changeoverTime": 15, "operators": 2}
  ],
  "flows": [
    {"from": "Process1", "to": "Process2", "inventory": 500, "days": 2.5}
  ],
  "metrics": {
    "totalLeadTime": 15.5,
    "totalCycleTime": 180,
    "taktTime": 45.0,
    "valueAddedRatio": 0.013
  },
  "coordinates": {
    "supplier": {"x": 50, "y": 100},
    "customer": {"x": 850, "y": 100},
    "productionControl": {"x": 450, "y": 100}
  }
}

RULES:
- X coordinates: 100-900 (left to right)
- Y coordinates: processes at 300, info boxes at 100
- Space processes evenly horizontally
- Calculate inventory days = inventory / demand

Generate ONLY valid JSON:`;
}

// Extract JSON from LLM output
function extractJSON(text: string): VSMPlotData | null {
  try {
    // Try to find JSON between markers
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure
      if (parsed.processes && parsed.flows && parsed.metrics) {
        return parsed as VSMPlotData;
      }
    }
    return null;
  } catch (e) {
    console.log('Failed to parse JSON from LLM output');
    return null;
  }
}

// Validate and fix LLM output with rules
function validateAndFixPlotData(
  llmData: VSMPlotData | null,
  processes: Process[],
  demand: string,
  taktTime: number
): VSMPlotData {
  const demandNum = parseFloat(demand);
  
  // If LLM failed, generate from scratch
  if (!llmData || !llmData.processes || llmData.processes.length === 0) {
    console.log('Generating from rule-based template');
    return generateRuleBasedPlotData(processes, demandNum, taktTime);
  }

  // Fix process coordinates
  const spacing = 800 / (processes.length + 1);
  llmData.processes.forEach((proc, i) => {
    // Fix X coordinate if out of bounds
    if (proc.x < 100 || proc.x > 900) {
      proc.x = 100 + (i + 1) * spacing;
    }
    // Fix Y coordinate
    if (proc.y < 250 || proc.y > 350) {
      proc.y = 300;
    }
    // Validate numeric fields
    if (isNaN(proc.cycleTime) || proc.cycleTime <= 0) {
      proc.cycleTime = parseFloat(processes[i].cycleTime);
    }
  });

  // Fix flows
  if (!llmData.flows || llmData.flows.length !== processes.length - 1) {
    llmData.flows = [];
    for (let i = 0; i < processes.length - 1; i++) {
      const inv = parseFloat(processes[i].inventoryAfter);
      llmData.flows.push({
        from: processes[i].name,
        to: processes[i + 1].name,
        inventory: inv,
        days: inv / demandNum
      });
    }
  }

  // Recalculate metrics
  const totalCycleTime = llmData.processes.reduce((sum, p) => sum + p.cycleTime, 0);
  const totalInventory = llmData.flows.reduce((sum, f) => sum + f.inventory, 0);
  const leadTimeDays = totalInventory / demandNum;

  llmData.metrics = {
    totalLeadTime: leadTimeDays,
    totalCycleTime: totalCycleTime,
    taktTime: taktTime,
    valueAddedRatio: totalCycleTime / (leadTimeDays * 86400)
  };

  // Fix info box coordinates
  if (!llmData.coordinates) {
    llmData.coordinates = {
      supplier: { x: 50, y: 100 },
      customer: { x: 850, y: 100 },
      productionControl: { x: 450, y: 100 }
    };
  }

  return llmData;
}

// Generate from rules if LLM completely fails
function generateRuleBasedPlotData(
  processes: Process[],
  demand: number,
  taktTime: number
): VSMPlotData {
  const spacing = 800 / (processes.length + 1);
  
  const plotProcesses = processes.map((p, i) => ({
    name: p.name,
    x: 100 + (i + 1) * spacing,
    y: 300,
    cycleTime: parseFloat(p.cycleTime),
    uptime: parseFloat(p.uptime),
    changeoverTime: parseFloat(p.changeoverTime),
    operators: parseInt(p.operators)
  }));

  const flows = processes.slice(0, -1).map((p, i) => {
    const inv = parseFloat(p.inventoryAfter);
    return {
      from: p.name,
      to: processes[i + 1].name,
      inventory: inv,
      days: inv / demand
    };
  });

  const totalCycleTime = plotProcesses.reduce((sum, p) => sum + p.cycleTime, 0);
  const totalInventory = flows.reduce((sum, f) => sum + f.inventory, 0);
  const leadTimeDays = totalInventory / demand;

  return {
    processes: plotProcesses,
    flows: flows,
    metrics: {
      totalLeadTime: leadTimeDays,
      totalCycleTime: totalCycleTime,
      taktTime: taktTime,
      valueAddedRatio: totalCycleTime / (leadTimeDays * 86400)
    },
    coordinates: {
      supplier: { x: 50, y: 100 },
      customer: { x: 850, y: 100 },
      productionControl: { x: 450, y: 100 }
    }
  };
}

// Generate analysis text
function generateAnalysisText(
  plotData: VSMPlotData,
  processes: Process[],
  taktTime: number
): string {
  const bottleneck = plotData.processes.reduce((max, p) => 
    p.cycleTime > max.cycleTime ? p : max
  );

  const canMeetDemand = bottleneck.cycleTime <= taktTime;

  return `VALUE STREAM ANALYSIS

BOTTLENECK IDENTIFIED: ${bottleneck.name}
- Cycle Time: ${bottleneck.cycleTime}s
- Takt Time: ${taktTime.toFixed(1)}s
- Status: ${canMeetDemand ? 'Can meet demand' : 'Cannot meet demand'}
- Gap: ${(bottleneck.cycleTime - taktTime).toFixed(1)}s

KEY METRICS:
- Total Lead Time: ${plotData.metrics.totalLeadTime.toFixed(1)} days
- Total Cycle Time: ${plotData.metrics.totalCycleTime}s (${(plotData.metrics.totalCycleTime/60).toFixed(1)} min)
- Value-Added Ratio: ${(plotData.metrics.valueAddedRatio * 100).toFixed(3)}%

TOP 3 IMPROVEMENTS:
1. ${bottleneck.uptime < 90 ? 'Implement TPM for reliability' : 'SMED for changeover reduction'}
   Expected: ${bottleneck.uptime < 90 ? '+5-10% uptime' : '-50% changeover time'}

2. Reduce WIP inventory by 50%
   Lead time reduction: ${(plotData.metrics.totalLeadTime * 0.5).toFixed(1)} days

3. Line balancing and cross-training
   Expected capacity increase: +15-20%

IMPLEMENTATION PRIORITY:
Week 1-2: Quick wins (5S, visual management)
Week 3-6: SMED workshops
Month 2-3: TPM foundation`;
}

// Generate ASCII diagram from plot data
function generateASCIIDiagram(plotData: VSMPlotData): string {
  let diagram = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         VALUE STREAM MAP                                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝

INFORMATION FLOW:
    [SUPPLIER] ──monthly──► [PRODUCTION CONTROL] ◄──daily── [CUSTOMER]

MATERIAL FLOW:
`;

  plotData.processes.forEach((proc, i) => {
    diagram += `
    ┌──────────────────┐
    │  ${proc.name.padEnd(14)} │
    ├──────────────────┤
    │ C/T: ${proc.cycleTime.toString().padEnd(10)}s│
    │ C/O: ${proc.changeoverTime.toString().padEnd(8)}min│
    │ UP:  ${proc.uptime.toString().padEnd(10)}%│
    └──────────────────┘`;
    
    if (i < plotData.flows.length) {
      diagram += `
            ▼
           ▲ ${plotData.flows[i].inventory} units
          / ${plotData.flows[i].days.toFixed(1)} days \\`;
    }
  });

  diagram += `
            ▼
    [SHIPPING TO CUSTOMER]

SUMMARY:
Lead Time: ${plotData.metrics.totalLeadTime.toFixed(1)} days
Cycle Time: ${plotData.metrics.totalCycleTime}s
VA Ratio: ${(plotData.metrics.valueAddedRatio * 100).toFixed(3)}%
`;

  return diagram;
}