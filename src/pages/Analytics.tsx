import React, { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Users, 
  MessageSquare, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';

const COLORS = ['#6366f1', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa'];
const apiKey  = import.meta.env.VITE_API_KEY;
// Add skeleton component directly
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

interface GeneralStats {
  total_requests: number;
  unique_conversations: number;
  unique_users: number;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  error_rate: number;
}

interface TimeSeriesItem {
  time_bucket: string;
  request_count: number;
  total_tokens: number;
  total_cost: number;
  avg_latency: number;
  unique_users: number;
  error_count: number;
}

interface Trends {
  request_trend: number;
  cost_trend: number;
  token_trend: number;
}

interface Statistics {
  general_stats: GeneralStats;
  model_distribution: Record<string, number>;
  time_series: TimeSeriesItem[];
  trends: Trends;
}

export default function Analytics() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number | ''>(30);
  const [timeSeriesInterval, setTimeSeriesInterval] = useState<string>('day');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = new URL('https://api4prod.elevatics.space/observability/export-statistics');
        const params = new URLSearchParams({
          time_series_interval: timeSeriesInterval,
          ...(days !== '' && { days: days.toString() })
        });

        const response = await fetch(`${url}?${params}`, {
          headers: { 'accept': 'application/json',
            'X-API-Key': apiKey, // Add API key here
           },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setStatistics(data.statistics);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [days, timeSeriesInterval]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (timeSeriesInterval) {
      case 'hour':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'day':
        return date.toLocaleDateString();
      case 'week':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return dateString;
    }
  };

  const MetricCard = ({ 
    icon, 
    title, 
    value,
    trend
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    trend?: number;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-gray-900">{value}</span>
            {trend !== undefined && (
              <span className={`flex items-center text-sm ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl flex items-center gap-4">
        <AlertCircle className="h-6 w-6 text-red-600" />
        <div>
          <h3 className="text-red-800 font-medium">Error loading analytics</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !statistics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const { general_stats, time_series, model_distribution, trends } = statistics;

  const modelData = Object.entries(model_distribution).map(([name, value]) => ({
    name: name.split(':')[0].replace(/\./g, ' '),
    value,
    color: COLORS[Object.keys(model_distribution).indexOf(name) % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights and metrics about your chatbot performance
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value ? Math.max(1, parseInt(e.target.value)) : "")}
            className="w-full sm:w-32 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Days"
            min="1"
          />
          <select
            value={timeSeriesInterval}
            onChange={(e) => setTimeSeriesInterval(e.target.value)}
            className="w-full sm:w-40 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<MessageSquare className="h-6 w-6" />}
          title="Total Conversations"
          value={general_stats.unique_conversations}
          trend={trends.request_trend}
        />
        <MetricCard
          icon={<Users className="h-6 w-6" />}
          title="Unique Users"
          value={general_stats.unique_users}
        />
        <MetricCard
          icon={<Zap className="h-6 w-6" />}
          title="Avg. Latency"
          value={`${general_stats.avg_latency.toFixed(2)}s`}
        />
        <MetricCard
          icon={<DollarSign className="h-6 w-6" />}
          title="Total Cost"
          value={`$${general_stats.total_cost.toFixed(2)}`}
          trend={trends.cost_trend}
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Request Timeline
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={time_series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time_bucket"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatDate}
                  angle={timeSeriesInterval === 'month' ? 0 : -45}
                  textAnchor={timeSeriesInterval === 'month' ? 'middle' : 'end'}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  labelFormatter={formatDate}
                  formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                />
                <Bar 
                  dataKey="request_count" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
      {/* Model Distribution */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Model Usage Distribution
  </h3>
  <div className="h-80 flex flex-col">
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={modelData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
          >
            {modelData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ payload }) => (
              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                <p className="font-medium text-sm">
                  {payload?.[0]?.name}
                </p>
                <p className="text-sm">
                  Requests: {payload?.[0]?.value?.toLocaleString()}
                </p>
                <p className="text-sm">
                  {((payload?.[0]?.payload?.percent || 0) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          />
          <Legend 
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ 
              right: -140,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 30 
            }}
            content={({ payload }) => (
              <div className="space-y-2">
                {payload?.map((entry, index) => (
                  <div 
                    key={`legend-${index}`} 
                    className="flex items-center gap-2 text-sm"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate" title={entry.value}>
                      {entry.value?.split(' ').slice(0, 3).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    {/* Total Models */}
    <div className="pt-4 border-t border-gray-100 mt-4">
      <p className="text-sm text-gray-500 text-center">
        {modelData.length} unique models tracked
      </p>
    </div>
  </div>
</div>
      </div>

      {/* Additional Metrics */}
      <div className="grid lg:grid-cols-3 gap-6">
        <MetricCard
          icon={<Activity className="h-6 w-6" />}
          title="Total Tokens"
          value={general_stats.total_tokens.toLocaleString()}
          trend={trends.token_trend}
        />
        <MetricCard
          icon={<Clock className="h-6 w-6" />}
          title="Peak Hour"
          value={formatDate(time_series.reduce((max, curr) => 
            curr.request_count > max.request_count ? curr : max
          , time_series[0]).time_bucket)}
        />
        <MetricCard
          icon={<AlertCircle className="h-6 w-6" />}
          title="Error Rate"
          value={`${general_stats.error_rate}%`}
        />
      </div>
    </div>
  );
}