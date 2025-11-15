// lib/vsm-training-responses.ts

export interface TrainingExample {
  user_query: string;
  assistant_response: string;
  keywords: string[];
}

export const vsmTrainingResponses: TrainingExample[] = [
  // VSM Definition
  {
    user_query: "what is value stream mapping",
    keywords: ["what is", "vsm", "value stream mapping", "explain", "define"],
    assistant_response: `Value Stream Mapping is a lean manufacturing technique used to analyze, design, and manage the flow of materials and information required to bring a product to a customer.

Core Purpose:
- Document current state of processes
- Identify waste and inefficiencies
- Design improved future state
- Create implementation roadmap

The Three Flows:

1. Material Flow (horizontal)
   Physical movement through processes

2. Information Flow (top)
   Orders, schedules, forecasts

3. Timeline (bottom)
   Value-added vs waiting time

The 8 Wastes (DOWNTIME):
D - Defects (rework, scrap)
O - Overproduction (making too much)
W - Waiting (idle time)
N - Non-utilized talent (unused skills)
T - Transportation (moving materials)
I - Inventory (excess stock)
M - Motion (unnecessary movement)
E - Extra-processing (unnecessary work)

Want to create one for your operation?`
  },

  // Takt Time
  {
    user_query: "calculate takt time",
    keywords: ["takt time", "takt", "calculate takt", "production pace"],
    assistant_response: `Takt Time - The Heartbeat of Production

Formula: Takt Time = Available Time / Customer Demand

Detailed Example:

Given:
- Working hours: 8 hours = 480 minutes
- Break time: 30 minutes
- Available time: 450 minutes = 27,000 seconds
- Customer demand: 450 units/day

Calculation:
Takt Time = 27,000 / 450 = 60 seconds per unit

Meaning:
You must complete one unit every 60 seconds to meet demand.

Usage in VSM:
- Compare all cycle times to takt
- If Cycle Time > Takt Time = BOTTLENECK
- If Cycle Time < Takt Time = Spare capacity
- Target: Balance all processes to takt

Critical Understanding:
Takt is set by CUSTOMER, not your capability.
You cannot change takt by improving - you improve to MEET takt.

Enter your demand in the form to calculate!`
  },

  // 8 Wastes Detailed
  {
    user_query: "explain the 8 wastes",
    keywords: ["8 wastes", "downtime", "types of waste", "muda", "lean waste"],
    assistant_response: `The 8 Wastes in Lean Manufacturing (DOWNTIME)

D - Defects
Products requiring rework or scrap
Impact: Quality costs, capacity loss

O - Overproduction
Making more than needed or before needed
Impact: Inventory buildup, cash tied up

W - Waiting
Idle time when work is not moving
Impact: Increased lead time, low productivity

N - Non-utilized Talent
Not using people's skills and knowledge
Impact: Missed improvements, low morale

T - Transportation
Unnecessary movement of materials
Impact: Time waste, damage risk

I - Inventory
Excess raw materials, WIP, or finished goods
Impact: Space costs, quality issues hidden

M - Motion
Unnecessary movement of people
Impact: Time waste, ergonomic issues

E - Extra-processing
More work than required by customer
Impact: Added costs without value

VSM Connection:
These wastes show up as inventory triangles, long timelines, and process inefficiencies on your map.

Which waste affects your process most?`
  },

  // Bottleneck Identification
  {
    user_query: "identify bottleneck",
    keywords: ["bottleneck", "constraint", "slowest", "capacity", "limiting"],
    assistant_response: `Bottleneck Identification

A bottleneck is your slowest process step - it limits entire throughput.

How to Find:
1. Compare all cycle times
2. The longest cycle time is typically your bottleneck
3. Compare to takt time

Example Analysis:

Takt time: 60 seconds
- Process A: 45s (OK - faster than takt)
- Process B: 120s (BOTTLENECK - 2× takt)
- Process C: 50s (OK - faster than takt)

Capacity Impact:
Process B capacity: 28,800s / 120s = 240 units/shift
Required capacity: 28,800s / 60s = 480 units/shift
Shortfall: 240 units/shift (50% deficit)

Visual Indicators:
- Large inventory buildup BEFORE bottleneck
- Idle time AFTER bottleneck
- Overtime at specific process

Solutions:

Immediate:
- Add parallel capacity (2nd machine)
- Maximize uptime (preventive maintenance)
- Reduce changeover time

Long-term:
- Reduce cycle time through improvement
- Redistribute work to other processes
- Process redesign

Key Principle:
After fixing one bottleneck, another emerges.
VSM is iterative toward perfection.

Want help identifying yours?`
  },

  // Lead Time and Value-Added Ratio
  {
    user_query: "lead time vs cycle time",
    keywords: ["lead time", "cycle time", "difference", "va ratio", "value added"],
    assistant_response: `Cycle Time vs Lead Time

Cycle Time:
Time to complete ONE unit at ONE process step
Example: 45 seconds to weld one part
Measures: Process speed

Lead Time:
Total time from order to delivery
Example: 5 days from order to customer
Includes: All cycle times + waiting + transport

Formula:
Lead Time = Σ(Process Times) + Σ(Waiting Times)

Value-Added Ratio:
VA Ratio = (Total Cycle Time / Total Lead Time) × 100%

Example Calculation:

Process times: 225 seconds (3.75 minutes)
Waiting time: 5 days (7,200 minutes)
Total lead time: 7,203.75 minutes

VA Ratio = (3.75 / 7,203.75) × 100 = 0.05%

Interpretation:
Only 0.05% of time adds value!
99.95% is waste (mostly waiting)

Industry Benchmarks:
< 1% - Critical (typical batch manufacturing)
1-5% - Poor
5-10% - Below average
10-15% - Average
15-25% - Good
25-35% - Excellent (world-class)
> 35% - Best-in-class

Key Insight:
Typical lead time is 100-200× longer than processing time.
Don't speed up processes - reduce waiting time!

Need help calculating yours?`
  },

  // Days of Inventory
  {
    user_query: "calculate days of inventory",
    keywords: ["inventory", "wip", "days of inventory", "work in process"],
    assistant_response: `Days of Inventory Calculation

Formula: Days of Inventory = Inventory Quantity / Daily Demand

Example:

Inventory: 1,200 pieces
Daily demand: 480 units
Days of Inventory = 1,200 / 480 = 2.5 days

Meaning:
- 2.5 days of production sitting as WIP
- If upstream stops, can supply for 2.5 days
- Adds 2.5 days to lead time

Lean Targets:
World-class: < 0.5 days (4 hours)
Excellent: 0.5 - 1 day
Good: 1 - 2 days
Acceptable: 2 - 3 days
Poor: 3 - 5 days
Critical: > 5 days

Impact:

Lead Time: Direct increase by days of inventory
Working Capital: Quantity × Unit Cost tied up
Floor Space: Approximately 0.1 sq ft per piece
VA Ratio: Denominator increases (worse ratio)

Reduction Strategy:

Phase 1 (Immediate): Remove 50%
Target: 600 pieces (1.25 days)

Phase 2 (Month 1-3): Implement FIFO
Target: 240 pieces (0.5 days)

Phase 3 (Month 3-6): Create flow
Target: < 480 pieces (< 1 day)

Root Causes:
- Batch production
- Unbalanced cycle times
- Long changeovers
- Push system (not pull)

What's your current inventory level?`
  },

  // Future State Design
  {
    user_query: "create future state",
    keywords: ["future state", "improve", "kaizen", "design", "ideal"],
    assistant_response: `Future State VSM Design

Future state shows your value stream after lean improvements.

5 Lean Principles:

1. Define Value
   What customer pays for
   
2. Map Value Stream
   See all waste clearly
   
3. Create Flow
   Eliminate stops and waiting
   
4. Establish Pull
   Make only what's needed
   
5. Pursue Perfection
   Continuous improvement

Design Questions:

1. Where can we create continuous flow?
   Connect processes directly
   
2. Where do we need supermarkets?
   Control points with kanban
   
3. What's the pacemaker process?
   Usually final assembly
   
4. How do we level load?
   Mix models, small batches

Target Metrics:

Lead Time: 80% reduction
VA Ratio: 10× improvement
Inventory: 90% reduction
Quality: 50% defect reduction

Implementation Phases:

Month 1-2: Fix bottleneck, reduce inventory 50%
Month 3-4: Create flow cells, balance to takt
Month 5-6: Implement pull/kanban
Month 7-9: Level loading, mix models
Month 10-12: Standardize, continuous improvement

Kaizen Bursts:
Mark improvement opportunities on map with specific actions.

Ready to design your future state?`
  },

  // Drawing VSM
  {
    user_query: "how to draw vsm",
    keywords: ["draw", "create", "make", "symbols", "map"],
    assistant_response: `How to Draw a Value Stream Map

Structure (Top to Bottom):

1. Information Flow (Top)
- Customer (top right)
- Supplier (top left)
- Production Control (center)
- Information arrows (how orders flow)

2. Material Flow (Middle)
- Process boxes with data
- Inventory triangles between processes
- Material flow arrows (left to right)
- External shipments

3. Timeline (Bottom)
- Value-added time (seconds)
- Non-value-added time (days)
- Shows lead time graphically

Process Box Contains:
- C/T = Cycle Time (seconds)
- C/O = Changeover Time (minutes)
- Uptime = Availability %
- # Operators
- Available time per shift
- Batch size

Common Symbols:
📦 Process Box
▼ Inventory Triangle
→ Material Flow
⚡ Electronic Information
✉️ Manual Information
🏭 Outside Source
💥 Kaizen Burst (improvement)

Step-by-Step:

1. Walk the actual process (gemba)
2. Draw customer and supplier
3. Add all process boxes
4. Add inventory between each
5. Show information flows
6. Calculate and add timeline
7. Mark improvement opportunities

Data Needed:
- Cycle times (measure at gemba)
- Changeover times
- Uptime percentages
- Inventory quantities
- Customer demand

Ready? Use the data entry form on the right!`
  },

  // Gemba Walk
  {
    user_query: "gemba walk",
    keywords: ["gemba", "walk", "observe", "measure", "collect data"],
    assistant_response: `Gemba Walk for VSM Data Collection

Gemba = "The actual place" where work happens

Purpose:
See reality, not theory
Collect accurate data
Understand actual process

What to Bring:
- Stopwatch
- Clipboard and paper
- Calculator
- Camera (optional)
- VSM template

Step-by-Step Process:

1. Walk the Flow
   Follow material from start to finish
   Don't skip any steps

2. Observe Each Process
   Watch complete cycles
   Note all activities
   Talk to operators

3. Measure Cycle Times
   Time multiple cycles (at least 10)
   Calculate average
   Note variation

4. Count Inventory
   Physical count of all WIP
   Note location
   Measure space used

5. Document Information Flow
   How orders received
   How schedule communicated
   What triggers production

What to Ask Operators:
- How long is typical cycle?
- What causes delays?
- When do changeovers occur?
- What quality issues arise?
- What improvements would help?

Don't:
❌ Use theoretical data
❌ Rely on old documentation
❌ Rush measurements
❌ Skip "small" steps

Do:
✓ See actual conditions
✓ Measure during normal operation
✓ Ask "why" 5 times
✓ Verify with workers

After Gemba:
Return to desk
Draw map from observations
Calculate metrics
Identify waste and opportunities

Ready to document your findings?`
  },

  // Process Data Collection
  {
    user_query: "what process data needed",
    keywords: ["process", "data", "collect", "need", "measure"],
    assistant_response: `Process Data Collection Checklist

For each process step, collect:

CRITICAL (Must Have):

1. Cycle Time (seconds per unit)
   How long to process one piece
   Measure 10 cycles, calculate average

2. Changeover Time (minutes)
   Time to switch products/setups
   Include all setup activities

3. Uptime Percentage (%)
   Available time / Total time
   Account for breakdowns, maintenance

4. Number of Operators
   People working at this station
   Full-time equivalents

   IMPORTANT (Should Have):

5. Available Time per Shift (seconds)
   (Shift hours × 3600) - Break time
   Typically 27,000s for 8-hour shift

6. Batch Size (units)
   Processing batch quantity
   Enter 1 for one-piece flow

7. Inventory After Process (pieces)
   WIP waiting for next step
   Physical count

VALUABLE (Nice to Have):

8. Quality Metrics
   - Scrap rate (%)
   - Rework rate (%)
   - First pass yield (%)

9. Equipment Details
   - Machine type
   - Age and condition
   - Maintenance schedule

10. Layout Information
    - Distance to next process
    - Storage method
    - Material handling

Customer Demand Data:

- Units per day/week/month
- Working days per week
- Shift pattern
- Delivery frequency

Measurement Tips:

- Time during normal operations
- Include all work elements
- Measure multiple cycles
- Note variation causes
- Verify with operators

Use the VSM Data Entry form on the right to enter!`
  },

  // Industry-Specific (Foundry Example)
  {
    user_query: "foundry vsm",
    keywords: ["foundry", "casting", "melting", "molding"],
    assistant_response: `VSM for Foundry Operations

Typical Foundry Processes:
1. Melting (300s cycle time)
2. Molding (180s)
3. Casting (240s)
4. Cooling (600s - often bottleneck)
5. Finishing (240s)
6. Grinding (180s)
7. Inspection (120s)
8. Packaging (90s)

Common Bottlenecks:
- Cooling (long cycle due to physics)
- Molding (high changeover time)

Industry-Specific Challenges:

Quality Issues:
- Porosity defects
- Dimensional accuracy
- Surface finish problems
- Internal defects

Typical Metrics:
- Melt temperature control
- Cooling time optimization
- Yield rate (metal efficiency)
- Scrap rate reduction
- Metal purity standards

Foundry VSM Focus Areas:

1. Cooling Process
   Often the constraint
   Consider parallel capacity
   Optimize cooling cycles

2. Changeover Reduction
   Mold changes take time
   SMED methodology
   Quick-change systems

3. Quality at Source
   Prevent defects early
   Temperature control
   Process monitoring

Typical Parameters:
- Changeover: 90 minutes
- Uptime: 75% (lower due to heat/wear)
- Batch sizes: Often large due to setup

Need help mapping your foundry?`
  }
];

// Function to find best matching response
export function findBestResponse(userMessage: string): string | null {
  const messageLower = userMessage.toLowerCase();
  
  // Find responses where keywords match
  const matches = vsmTrainingResponses.filter(example => 
    example.keywords.some(keyword => messageLower.includes(keyword))
  );
  
  if (matches.length === 0) return null;
  
  // Return the first match (or implement more sophisticated matching)
  return matches[0].assistant_response;
}

// Get all available topics
export function getAvailableTopics(): string[] {
  return vsmTrainingResponses.map(ex => ex.user_query);
}