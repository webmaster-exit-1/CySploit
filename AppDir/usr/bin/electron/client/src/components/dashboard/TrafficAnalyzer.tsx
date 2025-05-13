import React, { useState } from 'react';
import NeonBorder from '@/components/common/NeonBorder';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { usePacketAnalyzer } from '@/lib/hooks/usePacketAnalyzer';
import { useSessions } from '@/lib/hooks/useSessions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Generate sample traffic data
const generateTrafficData = (hours: number) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
    
    // Create more realistic traffic pattern with peaks at typical times
    let hourFactor = Math.sin((time.getHours() / 24) * Math.PI * 2) * 0.5 + 0.5;
    if (time.getHours() >= 9 && time.getHours() <= 17) {
      hourFactor *= 1.5; // More traffic during work hours
    }
    
    // Add some randomness
    const randomFactor = 0.7 + Math.random() * 0.6;
    
    // Create incoming and outgoing values with different patterns
    const incoming = Math.round((0.5 + hourFactor) * randomFactor * 200) / 100;
    const outgoing = Math.round((0.3 + hourFactor * 0.7) * randomFactor * 200) / 100;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: time.getTime(),
      incoming,
      outgoing,
      total: incoming + outgoing
    });
  }
  
  return data;
};

const TrafficAnalyzer: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24');
  const { analyzeTrafficMutation } = usePacketAnalyzer();
  const { sessions } = useSessions();
  
  // Generate traffic data based on selected time range
  const trafficData = generateTrafficData(parseInt(timeRange));
  
  // Calculate statistics
  const totalTraffic = trafficData.reduce((sum, item) => sum + item.total, 0).toFixed(1);
  const incomingTraffic = trafficData.reduce((sum, item) => sum + item.incoming, 0).toFixed(1);
  const outgoingTraffic = trafficData.reduce((sum, item) => sum + item.outgoing, 0).toFixed(1);
  
  // Find peak rate
  const peakItem = [...trafficData].sort((a, b) => b.total - a.total)[0];
  const peakRate = peakItem ? peakItem.total.toFixed(1) : "0.0";
  const peakTime = peakItem ? peakItem.time : "N/A";
  
  const incomingPercentage = Math.round((parseFloat(incomingTraffic) / parseFloat(totalTraffic)) * 100);
  const outgoingPercentage = Math.round((parseFloat(outgoingTraffic) / parseFloat(totalTraffic)) * 100);
  
  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };
  
  // Find traffic spike
  const getTrafficSpike = () => {
    if (trafficData.length < 3) return null;
    
    for (let i = 1; i < trafficData.length - 1; i++) {
      const prev = trafficData[i - 1].total;
      const current = trafficData[i].total;
      const next = trafficData[i + 1].total;
      
      if (current > prev * 1.5 && current > next * 1.5) {
        return { 
          position: (i / (trafficData.length - 1)) * 100, 
          time: trafficData[i].time,
          value: current.toFixed(1)
        };
      }
    }
    
    return null;
  };
  
  const trafficSpike = getTrafficSpike();

  return (
    <NeonBorder color="purple" className="mb-8">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold font-rajdhani text-white flex items-center">
          <i className="ri-line-chart-line mr-2 text-accent"></i>
          Network Traffic Analysis
        </h2>
        <div className="flex space-x-3">
          <div className="flex items-center">
            <span className="text-xs text-gray-400 mr-2">Time Range:</span>
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="bg-background text-white text-sm w-36 h-8">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last Hour</SelectItem>
                <SelectItem value="24">Last 24 Hours</SelectItem>
                <SelectItem value="168">Last 7 Days</SelectItem>
                <SelectItem value="720">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="text-gray-400 hover:text-white flex items-center">
            <i className="ri-download-line mr-1"></i> Export
          </Button>
        </div>
      </div>
      
      <div className="p-4 h-64 bg-black bg-opacity-70 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={trafficData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9D00FF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#9D00FF" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(50, 59, 79, 0.5)" />
            <XAxis 
              dataKey="time" 
              stroke="#767676" 
              tick={{ fill: '#767676', fontSize: 10 }}
            />
            <YAxis 
              stroke="#767676" 
              tick={{ fill: '#767676', fontSize: 10 }}
              tickFormatter={(value) => `${value} GB`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(13, 17, 23, 0.9)', 
                border: '1px solid #323B4F',
                borderRadius: '0.25rem'
              }}
              itemStyle={{ color: '#F1F1F1' }}
              labelStyle={{ color: '#A0A4AB', marginBottom: '5px' }}
            />
            <Area 
              type="monotone" 
              dataKey="incoming" 
              stroke="#9D00FF" 
              fillOpacity={1} 
              fill="url(#colorIncoming)" 
            />
            <Line 
              type="monotone" 
              dataKey="incoming" 
              stroke="#9D00FF" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6 }} 
            />
            <Area 
              type="monotone" 
              dataKey="outgoing" 
              stroke="#00FFFF" 
              fillOpacity={1} 
              fill="url(#colorOutgoing)" 
            />
            <Line 
              type="monotone" 
              dataKey="outgoing" 
              stroke="#00FFFF" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Traffic spike marker */}
        {trafficSpike && (
          <>
            <div 
              className="absolute h-full w-1 bg-yellow-500 bg-opacity-30" 
              style={{ left: `${trafficSpike.position}%` }}
            ></div>
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-background bg-opacity-90 px-2 py-1 rounded border border-yellow-500 text-yellow-500 text-xs"
              style={{ 
                top: "20%", 
                left: `${trafficSpike.position}%`
              }}
            >
              Traffic Spike {trafficSpike.value} GB
            </div>
          </>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-background bg-opacity-80 p-2 rounded-lg border border-gray-800">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs">
              <span className="w-3 h-2 bg-accent mr-1"></span>
              <span className="text-accent">Incoming</span>
            </div>
            <div className="flex items-center text-xs">
              <span className="w-3 h-2 bg-primary mr-1"></span>
              <span className="text-primary">Outgoing</span>
            </div>
            <div className="flex items-center text-xs">
              <span className="w-3 h-2 bg-yellow-500 mr-1"></span>
              <span className="text-yellow-500">Anomaly</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Traffic stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        <div className="p-4">
          <p className="text-gray-400 text-sm mb-1">Total Traffic</p>
          <p className="text-xl font-bold text-white font-rajdhani">{totalTraffic} GB</p>
          <p className="text-xs text-primary mt-1 flex items-center">
            <i className="ri-arrow-up-line mr-1"></i> 75% from yesterday
          </p>
        </div>
        <div className="p-4">
          <p className="text-gray-400 text-sm mb-1">Incoming</p>
          <p className="text-xl font-bold text-accent font-rajdhani">{incomingTraffic} GB</p>
          <p className="text-xs text-gray-400 mt-1">{incomingPercentage}% of total</p>
        </div>
        <div className="p-4">
          <p className="text-gray-400 text-sm mb-1">Outgoing</p>
          <p className="text-xl font-bold text-primary font-rajdhani">{outgoingTraffic} GB</p>
          <p className="text-xs text-gray-400 mt-1">{outgoingPercentage}% of total</p>
        </div>
        <div className="p-4">
          <p className="text-gray-400 text-sm mb-1">Peak Rate</p>
          <p className="text-xl font-bold text-yellow-500 font-rajdhani">{peakRate} MB/s</p>
          <p className="text-xs text-gray-400 mt-1">At {peakTime}</p>
        </div>
      </div>
    </NeonBorder>
  );
};

export default TrafficAnalyzer;
