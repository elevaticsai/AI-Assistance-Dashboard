import React, { useState, useEffect } from 'react';
import { Upload, Search, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function KnowledgeBase() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<string | null>('digiyatra');
  const [userIdInput, setUserIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tables, setTables] = useState<any[]>([]);

  const baseUrl = 'https://pvanand-rag-chat-with-analytics.hf.space';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetUserId = () => {
    if (userIdInput.trim()) {
      setUserId(userIdInput.trim());
    }
  };

  const handleSearchDocuments = async () => {
    if (!searchQuery || !userId) {
      alert("Please enter a valid search query and user ID.");
      return;
    }
  
    console.log("Search Query:", searchQuery);
    console.log("User ID:", userId);
  
    try {
      const response = await axios.post(
        `${baseUrl}/rag/query_table`,
        {
          query: searchQuery,  // Assuming the backend expects this field
          user_id: userId      // Send the user_id in the request body if needed
        }
      );
      console.log("Search Results:", response.data);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error("Error searching documents:", error);
      alert(`Error searching documents: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchTables = async () => {
    if (userId) {
      try {
        const response = await axios.get(`${baseUrl}/rag/get_tables/${userId}`);
        setTables(response.data || []);
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    }
  };

  const handleUploadDocuments = async () => {
    if (!files.length || !userId || !tableName) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const url = new URL(`${baseUrl}/rag/create_table`);
      url.searchParams.append('user_id', userId);
      url.searchParams.append('table_name', tableName);  // Pass table_name here
      await axios.post(url.toString(), formData);
      alert('Documents uploaded successfully!');
      await fetchTables();
      setFiles([]);
    } catch (error) {
      alert('Error uploading documents: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTables();  // Fetch the list of tables when userId changes
    }
  }, [userId]);

  return (
    <div className="container mx-auto p-6">
      {/* Main Content */}
      <>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-700">Upload documents to train your AI assistant</p>
          </div>
          {/* <div>
            <button
              onClick={() => setUserId(null)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md"
            >
              Change User ID
            </button>
          </div> */}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800">Existing Tables:</h3>
        <br></br>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
  {tables.length > 0 ? (
    tables.map((table, index) => (
      <div
        key={index}
        className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
      >
        <h3 className="text-xl font-semibold mb-3">{table.table_name}</h3>
        <div className="flex items-center justify-between">
          <button
            onClick={() => selectTableForQuery(table)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Query Documents
          </button>
        </div>
      </div>
    ))
  ) : (
    <div className="col-span-full text-gray-500">
      No tables found.
    </div>
  )}
</div> */}
<div className="overflow-x-auto mb-8">
  {tables.length > 0 ? (
    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-lg">
      <thead className="bg-white-100 border-b border-gray-200">
        <tr>
          <th className="text-left px-6 py-4 font-medium text-black-600">Knowledge Base</th>
          <th className="text-left px-6 py-4 font-medium text-black-600">Created At</th>
          <th className="text-center px-6 py-4 font-medium text-black-600">Actions</th>
        </tr>
      </thead>
      <tbody>
        {tables.map((table, index) => (
          <tr key={index} className="border-b hover:bg-gray-50">
            <td className="px-6 py-4 text-gray-800">{table.table_name}</td>
            <td className="px-6 py-4 text-gray-600">{table.created_at || 'N/A'}</td>
            <td className="px-6 py-4 text-center">
              <button
                onClick={() => selectTableForQuery(table)}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ✏️
              </button>
              <button
                onClick={() => deleteTable(table)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="text-gray-500 text-center">
      No tables found.
    </div>
  )}
</div>



          <br></br>
        {/* Table Selection */}
        <div className="mb-6">
          
        <h3 className="text-xl font-semibold text-gray-800">Create Table:</h3>
          {/* <label className="text-sm font-semibold text-gray-700" htmlFor="table-name">Create Table</label> */}
          <input
            id="table-name"
            type="text"
            placeholder="Enter Table Name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md mt-2"
          />
        
        </div>

        {/* Search Section */}
        {/* <div className="mb-6">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleSearchDocuments()}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
            <div className="absolute right-4 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
          </div>
          <button
            onClick={handleSearchDocuments}
            className="mt-4 bg-indigo-600 text-white p-3 rounded-md"
          >
            Search Documents
          </button>
        </div> */}

        {/* Upload Section */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center mb-6 ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <Upload className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-4">
              Drag & Drop or Browse to Upload Files
            </p>
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-indigo-600 text-white py-3 px-6 rounded-md mb-4"
            >
              Upload Files
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                multiple
                onChange={handleFileInput}
              />
            </label>
            <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT up to 10MB each</p>
          </div>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <ul className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <li key={index} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUploadDocuments}
          disabled={isUploading}
          className="w-half bg-indigo-600 text-white py-3 rounded-md w-1/4"
        >
          {isUploading ? 'Uploading...' : 'Upload Documents'}
        </button>
      </>
    </div>
  );
}