import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

export function TodoApp() {
  const todos = useQuery(api.todos.listTodos) || [];
  const stats = useQuery(api.todos.getTodoStats);
  const latestSummary = useQuery(api.todos.getLatestSummary);
  
  const createTodo = useMutation(api.todos.createTodo);
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const generateSummary = useAction(api.todos.generateSummary);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
  });

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      await createTodo({
        title: newTodo.title,
        description: newTodo.description || undefined,
        priority: newTodo.priority,
        category: newTodo.category || undefined,
      });
      
      setNewTodo({ title: "", description: "", priority: "medium", category: "" });
      setIsModalOpen(false);
      toast.success("Todo created successfully! 🎉");
    } catch (error) {
      toast.error("Failed to create todo");
    }
  };

  const handleToggleTodo = async (id: Id<"todos">) => {
    try {
      await toggleTodo({ id });
      toast.success("Todo updated! ✅");
    } catch (error) {
      toast.error("Failed to update todo");
    }
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    try {
      await deleteTodo({ id });
      toast.success("Todo deleted! 🗑️");
    } catch (error) {
      toast.error("Failed to delete todo");
    }
  };

  const handleGenerateSummary = async () => {
    if (todos.length === 0) {
      toast.error("Add some todos first to generate a summary!");
      return;
    }

    setIsGenerating(true);
    try {
      await generateSummary();
      toast.success("AI summary generated! 🤖✨");
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTasksPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('My Todo List', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);
      doc.text(`Total: ${stats?.total || 0} | Completed: ${stats?.completed || 0}`, 20, 55);
      
      let y = 70;
      let count=1;
      todos.forEach((todo) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${count}. ${todo.title} -> ${todo.priority}(${todo.completed?"Completed":"Pending"})`, 20, y);
        y += 10;
        count+=1;
      });
      
      doc.save(`todos-${Date.now()}.pdf`);
      toast.success("Tasks downloaded as PDF! 📄");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const downloadSummaryPDF = async () => {
    if (!latestSummary) {
      toast.error("No summary available to download");
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('AI Productivity Summary', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date(latestSummary._creationTime).toLocaleDateString()}`, 20, 40);
      
      const lines = doc.splitTextToSize(latestSummary.content, 170);
      doc.text(lines, 20, 55);
      
      doc.save(`summary-${Date.now()}.pdf`);
      toast.success("Summary downloaded as PDF! 📄");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-gradient-to-r from-red-500 to-pink-500 text-white";
      case "medium": return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "low": return "bg-gradient-to-r from-green-400 to-emerald-500 text-white";
      default: return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔥";
      case "medium": return "⚡";
      case "low": return "🌱";
      default: return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 bg-pattern-dots">
      <div className="container mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 max-w-7xl mx-auto">
          
          {/* Stats Panel */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            <div className="card-modern p-4 lg:p-6 animate-slide-in-left">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
                    <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg lg:text-xl font-bold gradient-text-purple">Progress</h2>
                </div>
              </div>
              
              {stats && (
                <div className="space-y-3 lg:space-y-4">
                  <div className="grid grid-cols-2 gap-2 lg:gap-4">
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-violet-200/50">
                      <div className="text-xl lg:text-2xl font-bold text-violet-600">{stats.total}</div>
                      <div className="text-xs lg:text-sm text-violet-500 font-medium">Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-green-200/50">
                      <div className="text-xl lg:text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-xs lg:text-sm text-green-500 font-medium">Done</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-orange-200/50">
                      <div className="text-xl lg:text-2xl font-bold text-orange-600">{stats.pending}</div>
                      <div className="text-xs lg:text-sm text-orange-500 font-medium">Pending</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-red-200/50">
                      <div className="text-xl lg:text-2xl font-bold text-red-600">{stats.highPriority}</div>
                      <div className="text-xs lg:text-sm text-red-500 font-medium">Urgent</div>
                    </div>
                  </div>
                  
                  {stats.total > 0 && (
                    <div className="mt-4 lg:mt-6">
                      <div className="flex justify-between items-center mb-2 lg:mb-3">
                        <span className="text-xs lg:text-sm font-semibold text-gray-700">Completion Rate</span>
                        <span className="text-xs lg:text-sm font-bold gradient-text-purple">
                          {Math.round((stats.completed / stats.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3 overflow-hidden">
                        <div 
                          className="h-2 lg:h-3 rounded-full bg-gradient-to-r from-violet-400 via-purple-500 to-pink-600 transition-all duration-1000 ease-out"
                          style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={downloadTasksPDF}
                    className="w-full mt-4 lg:mt-6 btn-modern-purple text-white flex items-center justify-center space-x-2 text-sm lg:text-base py-2 lg:py-3"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export Tasks</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Summary Panel - Compact with View Button */}
            <div className="card-modern p-4 lg:p-6 animate-slide-in-left delay-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center animate-float">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-base lg:text-lg font-bold gradient-text-purple">AI Insights</h2>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating || todos.length === 0}
                  className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg lg:rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
              
              {latestSummary ? (
                <div className="space-y-3 lg:space-y-4">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-pink-200/50">
                    <div className="text-xs lg:text-sm text-gray-700 leading-relaxed line-clamp-3">
                      {latestSummary.content}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-gray-500">
                      {new Date(latestSummary._creationTime).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsSummaryModalOpen(true)}
                        className="px-2 py-1 lg:px-3 lg:py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-md lg:rounded-lg hover:shadow-md transition-all duration-200 text-xs font-medium flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </button>
                      <button
                        onClick={downloadSummaryPDF}
                        className="px-2 py-1 lg:px-3 lg:py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md lg:rounded-lg hover:shadow-md transition-all duration-200 text-xs font-medium flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 lg:py-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-3 animate-bounce-in">
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-xs lg:text-sm">
                    Add todos to get AI insights!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Todo List Panel */}
          <div className="lg:col-span-9">
            <div className="card-modern h-full flex flex-col animate-slide-in-right">
              <div className="p-4 lg:p-6 border-b border-gray-100/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse-glow">
                      <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h2 className="text-lg lg:text-2xl font-bold gradient-text-purple">Your Tasks</h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-modern-purple text-white flex items-center space-x-1 lg:space-x-2 px-3 py-2 lg:px-4 lg:py-3 text-sm lg:text-base"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">Add Task</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 lg:p-6">
                {todos.length === 0 ? (
                  <div className="text-center py-12 lg:py-20 animate-fade-in-up">
                    <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 lg:mb-6 animate-float">
                      <svg className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-600 mb-2 lg:mb-3">No tasks yet!</h3>
                    <p className="text-gray-400 mb-6 lg:mb-8 text-base lg:text-lg">
                      Create your first task to start tracking your productivity.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn-modern-purple text-white inline-flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Your First Task</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 lg:space-y-4">
                    {todos.map((todo, index) => (
                      <div
                        key={todo._id}
                        className={`group p-4 lg:p-6 border rounded-xl lg:rounded-2xl transition-all duration-300 hover:shadow-lg animate-slide-in-bottom ${
                          todo.completed 
                            ? "bg-gray-50/80 border-gray-200/50 opacity-75" 
                            : "bg-white/90 border-gray-200/50 hover:border-violet-300/50 shadow-soft backdrop-blur-sm"
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start gap-3 lg:gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => handleToggleTodo(todo._id)}
                              className="w-5 h-5 lg:w-6 lg:h-6 text-violet-600 rounded-lg lg:rounded-xl focus:ring-violet-500 focus:ring-2 transition-all duration-200 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3 flex-wrap">
                              <h3 className={`font-bold text-base lg:text-xl ${todo.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                                {todo.title}
                              </h3>
                              <div className="flex items-center gap-1 lg:gap-2">
                                <span className={`px-2 py-1 lg:px-3 lg:py-1.5 text-xs font-bold rounded-full ${getPriorityColor(todo.priority)} flex items-center gap-1 shadow-sm`}>
                                  <span>{getPriorityIcon(todo.priority)}</span>
                                  <span className="hidden sm:inline">{todo.priority.toUpperCase()}</span>
                                </span>
                                {todo.category && (
                                  <span className="px-2 py-1 lg:px-3 lg:py-1.5 text-xs font-semibold bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 rounded-full border border-violet-200/50">
                                    📁 {todo.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            {todo.description && (
                              <p className={`text-gray-600 leading-relaxed text-sm lg:text-lg ${todo.completed ? "line-through opacity-75" : ""}`}>
                                {todo.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="flex-shrink-0 p-2 lg:p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl lg:rounded-2xl transition-all duration-200 hover:scale-110 bg-red-50/50 border border-red-200/30"
                            title="Delete task"
                          >
                            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Adding Todo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 w-full max-w-md lg:max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold gradient-text-purple">Add New Task</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTodo} className="space-y-4 lg:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done? ✨"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  className="w-full px-4 py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-xl lg:rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-400/20 focus:border-violet-400 transition-all duration-300 bg-white shadow-sm text-base lg:text-lg text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Add some details..."
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  className="w-full px-4 py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-xl lg:rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-400/20 focus:border-violet-400 transition-all duration-300 bg-white shadow-sm resize-none text-base lg:text-lg text-gray-900 placeholder-gray-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as "low" | "medium" | "high" })}
                    className="w-full px-4 py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-xl lg:rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-400/20 focus:border-violet-400 transition-all duration-300 bg-white shadow-sm text-base lg:text-lg text-gray-900"
                  >
                    <option value="low">🌱 Low Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="high">🔥 High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Work, Personal"
                    value={newTodo.category}
                    onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                    className="w-full px-4 py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-xl lg:rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-400/20 focus:border-violet-400 transition-all duration-300 bg-white shadow-sm text-base lg:text-lg text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 lg:py-4 border border-gray-300 text-gray-700 rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-modern-purple text-white flex items-center justify-center space-x-2 py-3 lg:py-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {isSummaryModalOpen && latestSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold gradient-text-purple">AI Productivity Summary</h2>
                  <p className="text-sm text-gray-500">
                    Generated on {new Date(latestSummary._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200/50 mb-6">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {latestSummary.content}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={downloadSummaryPDF}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
