import React, { useEffect, useState } from 'react';
import { 
  BarChart as BarChartIcon, 
  Clock, 
  DollarSign, 
  CheckCircle 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell 
} from 'recharts';

const COLORS = ['#6366f1', '#34d399'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    avgLatency: 0,
    totalCost: 0,
    successRate: 0,
  });
  const [latencyData, setLatencyData] = useState([]);
  const [tokenDistribution, setTokenDistribution] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        'https://pvanand-rag-chat-with-analytics.hf.space/observability/all-unique-observations?format=json'
      );
      console.log(response,"response")
      const result = await response.json();
      setData(result.observations);
      updateMetrics(result.observations);
      prepareChartData(result.observations);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const updateMetrics = (observations) => {
    const totalTokens = observations.reduce((sum, d) => sum + d.total_tokens, 0);
    const avgLatency = observations.reduce((sum, d) => sum + d.latency, 0) / observations.length;
    const totalCost = observations.reduce((sum, d) => sum + d.cost, 0);
    const successRate = (observations.filter((d) => d.status === 'success').length / observations.length) * 100;

    setMetrics({
      totalTokens,
      avgLatency: avgLatency.toFixed(2),
      totalCost: totalCost.toFixed(4),
      successRate: successRate.toFixed(1),
    });
  };

  const prepareChartData = (observations) => {
    setTokenDistribution([
      {
        name: 'Prompt Tokens',
        value: observations.reduce((sum, d) => sum + d.prompt_tokens, 0),
      },
      {
        name: 'Completion Tokens',
        value: observations.reduce((sum, d) => sum + d.completion_tokens, 0),
      },
    ]);

    setLatencyData(
      observations.map((d) => ({
        time: new Date(d.created_at).toLocaleTimeString(),
        value: d.latency,
      }))
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            name: 'Tokens',
            value: metrics.totalTokens,
            change: 'Tokens processed',
            icon: BarChartIcon,
          },
          {
            name: 'Latency',
            value: `${metrics.avgLatency}s`,
            change: 'Average response time',
            icon: Clock,
          },
          {
            name: 'Cost',
            value: `$${metrics.totalCost}`,
            change: 'Cost per token',
            icon: DollarSign,
          },
          {
            name: 'Success Rate',
            value: `${metrics.successRate}%`,
            change: 'Requests completed successfully',
            icon: CheckCircle,
          },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden rounded-lg shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500">{stat.change}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Token Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tokenDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tokenDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Latency Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 8 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                  Time Stamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500  tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.total_tokens}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${request.cost.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Viewing Details */}
      {selectedRequest && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Request Details
      </h3>
      <div className="space-y-2">
        <p>
          <strong>ID:</strong> {selectedRequest.id}
        </p>
        <p>
          <strong>Created At:</strong>{' '}
          {new Date(selectedRequest.created_at).toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong> {selectedRequest.status}
        </p>
        <p>
          <strong>Model:</strong> {selectedRequest.model}
        </p>
        <p>
          <strong>Prompt Tokens:</strong> {selectedRequest.prompt_tokens}
        </p>
        <p>
          <strong>Completion Tokens:</strong>{' '}
          {selectedRequest.completion_tokens}
        </p>
        <p>
          <strong>Total Tokens:</strong> {selectedRequest.total_tokens}
        </p>
        <p>
          <strong>Cost:</strong> ${selectedRequest.cost.toFixed(4)}
        </p>
        <div className="border-t border-gray-200 mt-4 pt-4">
          <h4 className="font-medium text-gray-900">Conversation</h4>
          <p className="text-sm">
            <strong>Request:</strong>
          </p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(JSON.parse(selectedRequest.request), null, 2)}
          </pre>
          <p className="text-sm mt-2">
            <strong>Response:</strong>
          </p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {selectedRequest.response}
          </pre>
        </div>
      </div>
      <div className="mt-6 text-right">
        <button
          onClick={() => setSelectedRequest(null)}
          className="text-gray-700 hover:text-gray-900"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}