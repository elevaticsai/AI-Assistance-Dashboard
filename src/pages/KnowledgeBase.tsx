import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function KnowledgeBase() {
  const API_BASE = "https://api4rag.elevatics.site/rag";
  const apiKey = import.meta.env.VITE_API_KEY; // Load API Key from .env
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [tableInfo, setTableInfo] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [deleteCallback, setDeleteCallback] = useState<
    null | (() => Promise<void>)
  >(null);
  const [newDocument, setNewDocument] = useState({
    doc_id: "",
    doc_name: "",
    text: "",
    metadata: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed pagination
  const paginatedTableInfo = tableInfo.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(tableInfo.length / itemsPerPage);

  // Load tables from API
const loadTables = async () => {
  try {
    const response = await axios.get(`${API_BASE}/tables`,
      {
        method: 'GET', // Specify the method (GET, POST, etc.)
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey, // Add API key here
        },
      }
    );
    const tableList = response.data.tables;
    setTables(tableList);
  } catch (error) {
    console.error("Error loading tables:", error);
  }
};

// Ensure the first table is selected when tables update
useEffect(() => {
  if (tables.length > 0 && !selectedTable) {
    setSelectedTable(tables[0]);
  }
}, [tables, selectedTable]);  // Add selectedTable as a dependency to prevent unnecessary updates

useEffect(() => {
  loadTables();
}, []);

  // When a table is selected, load its info
  const selectTable = (table: string) => {
    setSelectedTable(table);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Load table information (documents)
  const loadTableInfo = async () => {
    if (!selectedTable) return;
    try {
      const response = await axios.get(
        `${API_BASE}/table_info/${selectedTable}`,
        {
          method: 'GET', // Specify the method (GET, POST, etc.)
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey, // Add API key here
          },
        }
      );
      setTableInfo(response.data.records);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading table info:", error);
    }
  };

  // Perform search query
  const performSearch = async () => {
    if (!searchQuery || !selectedTable) return;
    try {
      const response = await axios.post(
        `${API_BASE}/query/${selectedTable}`,
        { text: searchQuery, limit: 5 },
        { headers: { "Content-Type": "application/json",
          'X-API-Key': apiKey, 
         }, }
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error performing search:", error);
    }
  };

  // Create a new table
  const createTable = async () => {
    if (!newTableName) return;
    try {
      await axios.post(`${API_BASE}/create_table?table_name=${newTableName}`,{}, {
        headers: { "X-API-Key": apiKey },
      });
      await loadTables();
      setSelectedTable(newTableName);
      setShowCreateTableModal(false);
      setNewTableName("");
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  // Generate a UUID for document IDs
  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  // Add a new document via text input or file upload
  const addDocument = async () => {
    try {
      const docId = generateUUID();
      const documentToAdd = { ...newDocument, doc_id: docId };
      await axios.post(
        `${API_BASE}/add_documents/${selectedTable}`,
        [documentToAdd],
        { headers: { "Content-Type": "application/json" ,  'X-API-Key': apiKey} }
      );
      setNewDocument({ doc_id: "", doc_name: "", text: "", metadata: {} });
      await loadTableInfo();
      setShowAddSection(false);
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  // Delete a document (set callback to be called upon confirmation)
  const deleteDocument = async (docId: string) => {
    setDeleteTarget(`document ${docId}`);
    setDeleteCallback(() => async () => {
      try {
        await axios.delete(
          `${API_BASE}/delete_document/${selectedTable}/${docId}`, {
            headers: { "X-API-Key": apiKey },
          });
        setSearchResults((prev) => prev.filter((r) => r.doc_id !== docId));
        await loadTableInfo();
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    });
    setShowDeleteModal(true);
  };

  // Delete a table (set callback to be called upon confirmation)
  const deleteTable = async (table: string) => {
    try {
      await axios.delete(`${API_BASE}/delete_table/${table}`, {
        headers: { "X-API-Key": apiKey },
      });
      if (selectedTable === table) {
        setSelectedTable("");
      }
      await loadTables();
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  // Confirm deletion for document or table
  const confirmDelete = async () => {
    if (deleteCallback) {
      await deleteCallback();
      setShowDeleteModal(false);
      setDeleteTarget("");
      setDeleteCallback(null);
    }
  };

  // View document details in a modal
  const viewDocument = (doc: any) => {
    setSelectedDocument(doc);
  };

  // Truncate long text
  const truncateText = (text: string, length = 150) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  // Handle file upload for adding a document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    if (!selectedTable) {
      alert("Please select a table first");
      return;
    }
    setIsLoading(true);
    setLoadingMessage("Processing file...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(
        `${API_BASE}/upload_file/${selectedTable}`,
        formData,
        {
          headers: { "X-API-Key": apiKey, "Content-Type": "multipart/form-data" },
        }
      );
      const result = response.data;
      if (response.status === 200) {
        setLoadingMessage(
          `Successfully processed ${result.chunks} chunks from ${file.name}`
        );
        await loadTableInfo();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setLoadingMessage(
          `Error: ${result.detail || "Unknown error occurred"}`
        );
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setLoadingMessage(`Error: ${error.message || "Network error occurred"}`);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage("");
      }, 2000);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableInfo();
    }
  }, [selectedTable]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-7xl font-inter">
      {/* Header */}
      <header className="mb-8 md:mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            AI Document Search
          </h1>

          {/* <button
            onClick={() => setShowCreateTableModal(true)}
            className="px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow hover:from-indigo-700 hover:to-indigo-800 w-full md:w-auto"
          >
            <i className="fas fa-plus mr-2"></i>New Table
          </button> */}
        </div>
        {/* Table Tabs */}
        <div className="border-b border-gray-300">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {tables.map((table, idx) => (
              <div
                key={idx}
                className={`px-4 py-2 whitespace-nowrap hover:bg-gray-100 transition-colors rounded-t-lg cursor-pointer ${
                  selectedTable === table
                    ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
                    : "text-gray-600"
                }`}
                onClick={() => selectTable(table)}
              >
                {table}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(`table ${table}`);
                    setDeleteCallback(() => () => deleteTable(table));
                    setShowDeleteModal(true);
                  }}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <i className="fas fa-times"></i>
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {selectedTable && (
        <>
          {/* Search Section */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
                Search Documents
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && performSearch()}
                  placeholder="Enter your search query..."
                  className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
                />
                <button
                  onClick={performSearch}
                  className="px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow hover:from-indigo-700 hover:to-indigo-800 sm:w-auto w-full"
                >
                  <i className="fas fa-search mr-2"></i>Search
                </button>
              </div>
            </div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="px-4 py-2 rounded bg-gradient-to-r from-green-500 to-green-600 text-white shadow hover:from-green-600 hover:to-green-700 w-full sm:w-auto"
              >
                <i
                  className={`fas ${
                    showAddSection ? "fa-chevron-up" : "fa-plus"
                  } mr-2`}
                ></i>
                {showAddSection ? "Hide Add Form" : "Add Document"}
              </button>
            </div>
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4 mt-4">
                {searchResults.map((result) => (
                  <div
                    key={result.doc_id}
                    className="bg-white shadow rounded-lg p-4 sm:p-6 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-xl text-gray-800">
                        {result.doc_name}
                      </h3>
                      {result.score !== null && (
                        <span className="text-sm text-gray-500">
                          Distance: {result.score.toFixed(3)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-base mb-3">
                      {truncateText(result.text)}
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => viewDocument(result)}
                        className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => deleteDocument(result.doc_id)}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Document Section */}
          {showAddSection && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
                Add Document
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addDocument();
                }}
                className="space-y-6"
              >
                {/* File Upload Section */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded p-6 text-center mb-6 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.html,.txt,.csv,.json,.xml"
                  />
                  <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your file here or click to upload
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: PDF, PowerPoint, Word, Excel, HTML,
                    Text-based formats (CSV, JSON, XML)
                  </p>
                </div>

                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                      OR INPUT HERE
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name
                  </label>
                  <input
                    value={newDocument.doc_name}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        doc_name: e.target.value,
                      })
                    }
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newDocument.text}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, text: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow hover:from-indigo-700 hover:to-indigo-800"
                >
                  <i className="fas fa-plus mr-2"></i>Add Document
                </button>
              </form>
            </div>
          )}

          {/* Table Info Section */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
              Table Information
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Doc ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTableInfo.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 text-gray-500">{record.id}</td>
                      <td className="px-6 py-4">{record.doc_id}</td>
                      <td className="px-6 py-4">{record.doc_name}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {truncateText(record.text, 50)}
                      </td>
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <button
                          onClick={() => viewDocument(record)}
                          className="mr-2 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => deleteDocument(record.doc_id)}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-700">
                Showing {paginatedTableInfo.length} of {tableInfo.length}{" "}
                entries
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed bg-gray-200"
                      : "bg-gray-100"
                  }`}
                >
                  <i className="fas fa-chevron-left mr-1"></i>Previous
                </button>
                <span className="px-3 py-1 bg-gray-100 rounded">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed bg-gray-200"
                      : "bg-gray-100"
                  }`}
                >
                  Next<i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Create New Table
            </h2>
            <input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              className="mb-6 w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateTableModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createTable}
                className="px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow hover:from-indigo-700 hover:to-indigo-800"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedDocument.doc_name}
              </h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <i className="fas fa-times text-gray-700"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Document ID</h3>
                <p className="text-gray-600">{selectedDocument.doc_id}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Content</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedDocument.text}
                </p>
              </div>
              {selectedDocument.metadata && (
                <div>
                  <h3 className="font-medium text-gray-700">Metadata</h3>
                  <pre className="text-gray-600 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedDocument.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {deleteTarget}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-gradient-to-r from-red-500 to-red-600 text-white shadow hover:from-red-600 hover:to-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
          <div className="mb-4 w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-base sm:text-lg text-center px-4">
            {loadingMessage}
          </p>
        </div>
      )}
    </div>
  );
}