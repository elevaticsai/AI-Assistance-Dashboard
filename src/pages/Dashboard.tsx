import React, { useEffect, useState } from 'react';
import { 
  BarChart as BarChartIcon, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Download,
  ChevronLeft,
  ChevronRight
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
import jsPDF from 'jspdf';

const COLORS = ['#6366f1', '#34d399'];
const ITEMS_PER_PAGE = 10; // Number of items per page for pagination
const apiKey = import.meta.env.VITE_API_KEY; 
export default function Dashboard() {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    avgLatency: 0,
    totalCost: 0,
    successRate: 0,
  });
  const [latencyData, setLatencyData] = useState([]);
  const [tokenDistribution, setTokenDistribution] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE + 1;
      const response = await fetch(
        `https://api4db.elevatics.space/observability/export-observations-offset?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': apiKey
          }
        }
      );
      
      const result = await response.json();
      setData(result.observations || []);
      
      // Set pagination info
      if (result.pagination) {
        setTotalCount(result.pagination.total_count || 0);
        setTotalPages(result.pagination.total_pages || 1);
      }
      
      updateMetrics(result.observations || []);
      prepareChartData(result.observations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const updateMetrics = (observations: any) => {
    const totalTokens = observations.reduce((sum:any, d:any) => sum + d.total_tokens, 0);
    const avgLatency = observations.reduce((sum:any, d:any) => sum + d.latency, 0) / observations.length;
    const totalCost = observations.reduce((sum:any, d:any) => sum + d.cost, 0);
    const successRate = (observations.filter((d:any) => d.status === 'success').length / observations.length) * 100;

    setMetrics({
      totalTokens,
      avgLatency: avgLatency.toFixed(2) as any,
      totalCost: totalCost.toFixed(4),
      successRate: successRate.toFixed(1) as any,
    });
  };

  const prepareChartData = (observations: any) => {
    setTokenDistribution([
      {
        name: 'Prompt Tokens',
        value: observations.reduce((sum: any, d: any) => sum + d.prompt_tokens, 0),
      },
      {
        name: 'Completion Tokens',
        value: observations.reduce((sum: any, d: any) => sum + d.completion_tokens, 0),
      },
    ]);

    setLatencyData(
      observations.map((d :any) => ({
        time: new Date(d.created_at).toLocaleTimeString(),
        value: d.latency,
      }))
    );
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const convertToCSV = (data: any[]) => {
    const csv = [
      ['Role', 'Content'],
      ...data.map(item => [
        `"${item.role}"`,
        `"${item.content.replace(/"/g, '""')}"`
      ])
    ].map(e => e.join(',')).join('\n');
    return csv;
  };
  
  const downloadCSV = (data: any[]) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-conversation.csv';
    a.click();
  };
  
  const downloadPDF = (data: any[]) => {
    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 6.5; // Adjusted for precise text measurement
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2 - 20;
  
    // Add title
    doc.setFontSize(18);
    doc.text('Chat Conversation', margin, yPos);
    yPos += 18;
  
    data.forEach((msg) => {
      const content = doc.splitTextToSize(msg.content, maxWidth);
      const boxColor = msg.role === 'user' ? '#e2e8f0' : '#d1fae5';
      let currentPageLines = [];
      let lineIndex = 0;
  
      while(lineIndex < content.length) {
        // Calculate available space
        const availableSpace = pageHeight - yPos - 15;
        const maxLines = Math.floor(availableSpace / lineHeight);
        
        // Get lines for current page
        const pageLines = content.slice(lineIndex, lineIndex + maxLines);
        const boxHeight = (pageLines.length * lineHeight) + 8;
  
        // Draw background box
        doc.setFillColor(boxColor);
        doc.rect(margin, yPos - 2, maxWidth + 20, boxHeight, 'F');
  
        // Draw text
        doc.setFontSize(10);
        doc.setTextColor('#1e293b');
        doc.text(`${msg.role}:`, margin + 2, yPos + 4);
        doc.setTextColor('#475569');
        
        pageLines.forEach((line, i) => {
          doc.text(line, margin + 22, yPos + 4 + (i * lineHeight));
        });
  
        yPos += boxHeight + 8;
        lineIndex += maxLines;
  
        // Add new page if needed
        if(yPos > pageHeight - 30 && lineIndex < content.length) {
          doc.addPage();
          yPos = 20;
        }
      }
      
      // Add spacing between messages
      yPos += 12;
    });
  
    doc.save('chat-conversation.pdf');
  };
  
   // Function to download all chat history
   const downloadAllChats = (format: 'csv' | 'pdf') => {
    // Create a merged array of all conversations
    const allConversations: any[] = [];
    
    data.forEach((request: any) => {
      try {
        const conversation = JSON.parse(request.request);
        allConversations.push({
          id: request.id,
          timestamp: new Date(request.created_at).toLocaleString(),
          model: request.model,
          conversation: conversation
        });
      } catch (error) {
        console.error('Error parsing conversation:', error);
      }
    });
    
    if (format === 'csv') {
      // Create CSV for all conversations
      const csv = [
        ['Request ID', 'Timestamp', 'Model', 'Role', 'Content'],
        ...allConversations.flatMap(conv => 
          conv.conversation.map((msg: any) => [
            `"${conv.id}"`,
            `"${conv.timestamp}"`,
            `"${conv.model}"`,
            `"${msg.role}"`, 
            `"${msg.content.replace(/"/g, '""')}"`
          ])
        )
      ].map(e => e.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all-chat-conversations.csv';
      a.click();
    } else if (format === 'pdf') {
      // Create PDF for all conversations
      const doc = new jsPDF();
      let yPos = 20;
      const lineHeight = 6.5;
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const maxWidth = doc.internal.pageSize.getWidth() - margin * 2 - 20;
      
      // Add title
      doc.setFontSize(18);
      doc.text('All Chat Conversations', margin, yPos);
      yPos += 18;
      
      allConversations.forEach((conv) => {
        // Add conversation header
        doc.setFillColor('#f3f4f6');
        doc.rect(margin, yPos - 2, maxWidth + 20, 14, 'F');
        doc.setFontSize(12);
        doc.setTextColor('#1e293b');
        doc.text(`Request ID: ${conv.id} | ${conv.timestamp} | ${conv.model}`, margin + 2, yPos + 4);
        yPos += 20;
        
        // Add messages
        conv.conversation.forEach((msg: any) => {
          const content = doc.splitTextToSize(msg.content, maxWidth);
          const boxColor = msg.role === 'user' ? '#e2e8f0' : '#d1fae5';
          let lineIndex = 0;
          
          while(lineIndex < content.length) {
            // Calculate available space
            const availableSpace = pageHeight - yPos - 15;
            const maxLines = Math.floor(availableSpace / lineHeight);
            
            // Get lines for current page
            const pageLines = content.slice(lineIndex, lineIndex + maxLines);
            const boxHeight = (pageLines.length * lineHeight) + 8;
            
            // Add new page if needed
            if(yPos + boxHeight > pageHeight - 30) {
              doc.addPage();
              yPos = 20;
            }
            
            // Draw background box
            doc.setFillColor(boxColor);
            doc.rect(margin, yPos - 2, maxWidth + 20, boxHeight, 'F');
            
            // Draw text
            doc.setFontSize(10);
            doc.setTextColor('#1e293b');
            doc.text(`${msg.role}:`, margin + 2, yPos + 4);
            doc.setTextColor('#475569');
            
            pageLines.forEach((line, i) => {
              doc.text(line, margin + 22, yPos + 4 + (i * lineHeight));
            });
            
            yPos += boxHeight + 8;
            lineIndex += maxLines;
          }
        });
        
        // Add separator between conversations
        yPos += 10;
        doc.setDrawColor('#e5e7eb');
        doc.line(margin, yPos - 5, margin + maxWidth + 20, yPos - 5);
        yPos += 10;
        
        // Add new page if needed for next conversation
        if(yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      doc.save('all-chat-conversations.pdf');
    }
  };
  
  // Pagination logic
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
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
            change: 'Total Cost',
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
                  tick={{ fontSize: 7 }}
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

      {/* Recent Requests Section with Download All Button */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => downloadAllChats('csv')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-100 shadow-sm transition-colors"
            >
              <Download size={16} />
              Download All (CSV)
            </button>
            <button
              onClick={() => downloadAllChats('pdf')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-100 shadow-sm transition-colors"
            >
              <Download size={16} />
              Download All (PDF)
            </button>
          </div>
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
              {data.map((request: any) => (
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
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
            </span>{' '}
            of <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show at most 5 page buttons
              const pageGroup = Math.floor((currentPage - 1) / 5);
              return pageGroup * 5 + i + 1;
            }).filter(page => page <= totalPages).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Viewing Details */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4"
        onClick={() => setSelectedRequest(null)}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto relative"
           onClick={(e) => e.stopPropagation()} >
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-1 right-1 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              <i className="fas fa-times text-gray-700"></i>
            </button>

            {/* Header with buttons */}
            <div className=" mt-5 flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Request Details
              </h3>
              <div className="flex gap-4"> {/* Increased gap */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPDF(JSON.parse((selectedRequest as any).request));
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-100 shadow-sm transition-colors"
                >
                  <Download size={16} />
                  PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadCSV(JSON.parse((selectedRequest as any).request));
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-100 shadow-sm transition-colors"
                >
                  <Download size={16} />
                  CSV
                </button>
              </div>
            </div>
            {/* Request Info */}
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>ID:</strong> {(selectedRequest as any).id}
              </p>
              <p>
                <strong>Created At:</strong>{' '}
                {new Date((selectedRequest as any).created_at).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {(selectedRequest as any).status}
              </p>
              <p>
                <strong>Model:</strong> {(selectedRequest as any).model}
              </p>
              <p>
                <strong>Prompt Tokens:</strong> {(selectedRequest as any).prompt_tokens}
              </p>
              <p>
                <strong>Completion Tokens:</strong>{' '}
                {(selectedRequest as any).completion_tokens}
              </p>
              <p>
                <strong>Total Tokens:</strong> {(selectedRequest as any).total_tokens}
              </p>
              <p>
                <strong>Cost:</strong> ${(selectedRequest as any).cost.toFixed(4)}
              </p>
            </div>

            {/* Conversation Section */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Conversation</h4>
              <div className="space-y-4">
                {JSON.parse((selectedRequest as any).request).map((msg: any, index: number) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-green-100 text-green-900'
                      }`}
                    >
                      <p className="text-sm font-medium capitalize">{msg.role}</p>
                      <div className="mt-1 text-sm whitespace-pre-wrap">
                        {msg.content.split('\n').map((line: string, i: number) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
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