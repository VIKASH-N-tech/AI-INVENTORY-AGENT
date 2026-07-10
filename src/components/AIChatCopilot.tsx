import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  FileCheck, 
  ArrowRight,
  Package,
  MapPin,
  RefreshCw,
  Clock,
  ArrowLeftRight,
  Zap,
  ChevronRight
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: {
    action: "DRAFT_PO" | "UPDATE_STOCK" | "TRANSFER_STOCK";
    payload: any;
  } | null;
  actionExecuted?: boolean;
}

interface AIChatCopilotProps {
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onExecutePOAction: (payload: any) => Promise<void>;
  onExecuteStockAction: (payload: any) => Promise<void>;
  onExecuteTransferAction: (payload: any) => Promise<void>;
  themeMode?: "dark" | "light";
}

export default function AIChatCopilot({
  messages,
  onSendMessage,
  isLoading,
  onExecutePOAction,
  onExecuteStockAction,
  onExecuteTransferAction,
  themeMode = "dark"
}: AIChatCopilotProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const isDark = themeMode === "dark";

  const chips = [
    "Are there low stock items?",
    "Draft PO for packaging boxes",
    "Audit current inventory valuation",
    "Move M8 Screws from Coimbatore to Chennai"
  ];

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await onSendMessage(text);
  };

  const handleChipClick = async (chipText: string) => {
    if (isLoading) return;
    await onSendMessage(chipText);
  };

  const handleExecuteAction = async (msgId: string, actionType: string, payload: any) => {
    setExecutingActionId(msgId);
    try {
      if (actionType === "DRAFT_PO") {
        await onExecutePOAction(payload);
      } else if (actionType === "UPDATE_STOCK") {
        await onExecuteStockAction(payload);
      } else if (actionType === "TRANSFER_STOCK") {
        await onExecuteTransferAction(payload);
      }
      
      // Mark action as executed locally in message object
      const msg = messages.find(m => m.id === msgId);
      if (msg) {
        msg.actionExecuted = true;
      }
    } catch (e) {
      console.error("Action execution failed:", e);
    } finally {
      setExecutingActionId(null);
    }
  };

  // Scroll chat to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div 
      className={`border rounded-2xl shadow-volumetric flex flex-col h-[650px] overflow-hidden transition-all duration-300 ${
        isDark ? "bg-slate-900/35 border-slate-800/60" : "bg-white border-slate-200"
      }`} 
      id="chat-copilot-container"
    >
      {/* Chat header */}
      <div className={`p-4 border-b text-white flex items-center justify-between ${isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-slate-50 border-slate-150"}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-[#5B5FFF] rounded-xl border border-[#5B5FFF]/10">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`font-extrabold text-sm tracking-tight flex items-center gap-2 uppercase font-display ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              Co-Agent Operational Control
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Autonomous ledger triggers & industrial control</p>
          </div>
        </div>
        <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
          isDark ? "bg-slate-950/60 border-slate-800/80 text-[#00E5FF]" : "bg-slate-100 border-slate-200 text-slate-700"
        }`}>Gemini 3.5</span>
      </div>

      {/* Chat area */}
      <div className={`flex-1 p-5 overflow-y-auto space-y-4 flex flex-col transition-all duration-300 ${isDark ? "bg-slate-950/30" : "bg-slate-50/50"}`}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <Sparkles className="w-10 h-10 text-[#5B5FFF] mb-3 animate-pulse" />
            <h4 className={`font-extrabold text-sm font-display ${isDark ? "text-slate-200" : "text-slate-800"}`}>Aether Co-Agent Operational</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
              I can analyze stock trends, calculate inventory values, draft reorders, and trigger warehouse transfers directly.
            </p>
            
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-md animate-fade-in">
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer border ${
                    isDark
                      ? "bg-slate-900/40 border-slate-800/80 hover:border-[#5B5FFF]/40 text-slate-300 hover:text-[#5B5FFF] hover:shadow-[0_0_15px_rgba(91,95,255,0.15)]"
                      : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {messages.map((msg) => {
              const isAi = msg.role === "assistant";
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  <div className={`p-2 rounded-xl shrink-0 h-8 w-8 flex items-center justify-center border transition-all ${
                    isAi 
                      ? isDark 
                        ? "bg-slate-800 border-slate-700 text-slate-100" 
                        : "bg-white border-slate-200 text-slate-700" 
                      : "bg-gradient-to-r from-[#5B5FFF] to-[#5B5FFF]/80 text-slate-100 border-transparent"
                  }`}>
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all duration-300 ${
                      isAi 
                        ? isDark
                          ? "bg-slate-900/60 border border-slate-800/80 text-slate-200 rounded-tl-none font-medium" 
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium"
                        : "bg-gradient-to-r from-[#5B5FFF] to-[#00E5FF] text-white font-semibold rounded-tr-none"
                    }`}>
                      {msg.content.split("\n").map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                      ))}
                    </div>

                    {/* Action proposal block */}
                    {isAi && msg.action && (
                      <div className={`border rounded-2xl overflow-hidden shadow-volumetric animate-fade-in w-full max-w-sm transition-all ${
                        isDark ? "border-[#5B5FFF]/30 bg-slate-900/60" : "border-indigo-100 bg-white"
                      }`}>
                        <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                          isDark ? "bg-slate-950/80 border-slate-800/80 text-slate-100" : "bg-slate-50 border-slate-100 text-slate-800"
                        }`}>
                          <div className="flex items-center gap-1.5 text-xs font-extrabold tracking-tight">
                            <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            <span>AI Ledger Action Proposal</span>
                          </div>
                          <span className="text-[9px] bg-indigo-500/10 text-[#5B5FFF] px-2.5 py-1 rounded-lg font-mono font-extrabold tracking-wider uppercase">Pending Approval</span>
                        </div>

                        <div className="p-4 space-y-3">
                          {msg.action.action === "DRAFT_PO" && (
                            <div className="space-y-2 text-xs">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Drafted Purchase Order</p>
                              <div className={`flex justify-between items-center text-slate-300 border-b pb-1.5 ${isDark ? "border-slate-800" : "border-slate-100 text-slate-700"}`}>
                                <span className="font-bold flex items-center gap-1">
                                  <Package className="w-3.5 h-3.5 text-slate-500" /> Supplier:
                                </span>
                                <span className="font-semibold">{msg.action.payload.supplierId === "sup-1" ? "Chennai Techtronics" : "Kovai Packaging"}</span>
                              </div>
                              <div className={`space-y-1 p-2.5 rounded-xl border ${isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                                {msg.action.payload.items?.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between">
                                    <span className="text-slate-400 font-medium">Restock Item:</span>
                                    <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>+{item.qty} units</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.action.action === "TRANSFER_STOCK" && (
                            <div className="space-y-2 text-xs">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Proposed Warehouse Stock Movement</p>
                              <div className={`p-3 rounded-xl border flex items-center justify-between text-slate-300 gap-2 ${
                                isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}>
                                <div className="text-center">
                                  <span className="text-[9px] text-slate-500 block font-bold">SOURCE</span>
                                  <span className="font-bold text-[11px] block mt-0.5">Coimbatore Depot</span>
                                </div>
                                <ArrowLeftRight className="w-4 h-4 text-indigo-400 shrink-0" />
                                <div className="text-center">
                                  <span className="text-[9px] text-slate-500 block font-bold">DESTINATION</span>
                                  <span className="font-bold text-[11px] block mt-0.5">Chennai Mega Hub</span>
                                </div>
                              </div>
                              <div className={`flex justify-between text-[11px] border-t pt-2 font-semibold ${isDark ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-700"}`}>
                                <span className="text-slate-400">Transfer Qty:</span>
                                <span className={`${isDark ? "text-slate-200" : "text-slate-800"} font-bold`}>{msg.action.payload.qty} units</span>
                              </div>
                            </div>
                          )}

                          {/* Approval buttons */}
                          {msg.actionExecuted ? (
                            <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl mt-3 animate-pulse">
                              <FileCheck className="w-4 h-4" />
                              <span>Ledger Action Executed & Logged</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleExecuteAction(msg.id, msg.action!.action, msg.action!.payload)}
                              disabled={executingActionId === msg.id}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent"
                            >
                              {executingActionId === msg.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Writing to Ledger...</span>
                                </>
                              ) : (
                                <>
                                  <FileCheck className="w-4 h-4" />
                                  <span>Approve AI Ledger Request</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Loading / Thinking indicator */}
            {isLoading && (
              <div className="flex gap-3 mr-auto animate-pulse">
                <div className="p-2 rounded-xl bg-slate-800 text-slate-100 h-8 w-8 flex items-center justify-center border border-slate-700 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className={`p-3 border rounded-xl rounded-tl-none flex items-center gap-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></span>
                  <span className="text-xs text-slate-400 font-bold font-mono">Co-Agent auditing database...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className={`p-4 border-t flex gap-2.5 transition-all ${isDark ? "bg-slate-900 border-slate-800/80" : "bg-white border-slate-150"}`} id="chat-copilot-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Copilot to check alerts, draft purchase orders..."
          id="input-copilot-message"
          className={`flex-1 px-4 py-3 rounded-xl text-xs outline-none border transition-all duration-300 ${
            isDark
              ? "bg-slate-950/55 border-slate-800/80 focus:border-[#5B5FFF] text-slate-100 placeholder-slate-500"
              : "bg-slate-100 border-slate-200 focus:border-[#5B5FFF] text-slate-800 placeholder-slate-400"
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          id="btn-send-copilot-msg"
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-slate-100 px-4 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
