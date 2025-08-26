import { useState, useCallback } from "react";
import { TableExplorer } from "@/components/TableExplorer";
import { QueryTabs } from "@/components/QueryTabs";
import { QueryTab } from "@/components/QueryTab";

// Mock data for demonstration
const mockTables = [
  {
    name: "faults",
    columns: [
      { name: "faultid", type: "int", nullable: false },
      { name: "symptom", type: "nvarchar(255)", nullable: true },
      { name: "status", type: "int", nullable: false },
      { name: "userid", type: "int", nullable: true },
      { name: "dateoccured", type: "datetime", nullable: true },
      { name: "fdeleted", type: "bit", nullable: false },
      { name: "fhasbeenclosed", type: "bit", nullable: false },
    ]
  },
  {
    name: "users",
    columns: [
      { name: "uid", type: "int", nullable: false },
      { name: "uusername", type: "nvarchar(100)", nullable: false },
      { name: "uemail", type: "nvarchar(255)", nullable: true },
      { name: "uactive", type: "bit", nullable: false },
    ]
  },
  {
    name: "area",
    columns: [
      { name: "aarea", type: "int", nullable: false },
      { name: "aareadesc", type: "nvarchar(100)", nullable: false },
      { name: "aactive", type: "bit", nullable: false },
    ]
  },
  {
    name: "requesttype",
    columns: [
      { name: "rtid", type: "int", nullable: false },
      { name: "rtdesc", type: "nvarchar(100)", nullable: false },
      { name: "rtactive", type: "bit", nullable: false },
    ]
  }
];

// Mock query execution
const mockExecuteQuery = async (sql: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock results for common queries
  if (sql.toLowerCase().includes("select") && sql.toLowerCase().includes("faults")) {
    return {
      columns: ["Id", "Company", "User", "Subject", "Type", "ServiceCategory"],
      rows: [
        [1001, "Acme Corp", "john.doe", "Network connectivity issue", "Incident", "Infrastructure"],
        [1002, "TechCorp", "jane.smith", "Password reset request", "Service Request", "Account Management"],
        [1003, "Global Inc", "bob.wilson", "Printer not working", "Incident", "Hardware"],
        [1004, "StartupXYZ", "alice.brown", "Software installation", "Service Request", "Software"],
        [1005, "Enterprise Ltd", "charlie.davis", "Email sync problems", "Incident", "Email"],
      ]
    };
  }
  
  // Default mock result
  return {
    columns: ["Result"],
    rows: [["Query executed successfully"]]
  };
};

const Index = () => {
  const [tabs, setTabs] = useState([
    {
      id: "console",
      title: "Console",
      isPinned: true,
      content: <QueryTab onExecute={mockExecuteQuery} />
    }
  ]);
  const [activeTabId, setActiveTabId] = useState("console");

  const handleNewTab = useCallback(() => {
    const newTab = {
      id: `query-${Date.now()}`,
      title: `Query ${tabs.length}`,
      isPinned: false,
      content: <QueryTab onExecute={mockExecuteQuery} />
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length]);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const handleTableSelect = useCallback((tableName: string) => {
    console.log("Table selected:", tableName);
  }, []);

  const handleColumnSelect = useCallback((tableName: string, columnName: string) => {
    console.log("Column selected:", tableName, columnName);
  }, []);

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <TableExplorer 
          tables={mockTables}
          onTableSelect={handleTableSelect}
          onColumnSelect={handleColumnSelect}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <QueryTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
      </div>
    </div>
  );
};

export default Index;
