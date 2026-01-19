"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface HealthStatus {
  frontend: "healthy" | "error";
  backend: "healthy" | "error" | "checking";
  timestamp: string;
  backendUrl?: string;
  error?: string;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus>({
    frontend: "healthy",
    backend: "checking",
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    checkBackendHealth();
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendHealth = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
    
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setHealth({
          frontend: "healthy",
          backend: "healthy",
          timestamp: new Date().toISOString(),
          backendUrl,
        });
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (error) {
      setHealth({
        frontend: "healthy",
        backend: "error",
        timestamp: new Date().toISOString(),
        backendUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "healthy") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === "checking") return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "healthy") return <Badge className="bg-green-500">Healthy</Badge>;
    if (status === "checking") return <Badge className="bg-yellow-500">Checking...</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Health Check</h1>
          <p className="text-muted-foreground">
            Monitor the status of frontend and backend services
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Frontend Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon status={health.frontend} />
                  Frontend
                </CardTitle>
                <StatusBadge status={health.frontend} />
              </div>
              <CardDescription>Next.js Application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium">Running</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">URL:</span>
                <span className="ml-2 font-mono text-xs">{window.location.origin}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Version:</span>
                <span className="ml-2">Next.js 15.5.9</span>
              </div>
            </CardContent>
          </Card>

          {/* Backend Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon status={health.backend} />
                  Backend API
                </CardTitle>
                <StatusBadge status={health.backend} />
              </div>
              <CardDescription>Fastify Server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium">
                  {health.backend === "healthy" ? "Connected" : health.backend === "checking" ? "Checking..." : "Disconnected"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">URL:</span>
                <span className="ml-2 font-mono text-xs">{health.backendUrl}</span>
              </div>
              {health.error && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Error:</span>
                  <span className="ml-2 text-red-500 text-xs">{health.error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Check:</span>
                <span className="font-mono">{new Date(health.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span>{process.env.NODE_ENV || "development"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-refresh:</span>
                <span>Every 30 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overall Status:</span>
                <span className="font-semibold">
                  {health.frontend === "healthy" && health.backend === "healthy" ? (
                    <span className="text-green-500">✓ All Systems Operational</span>
                  ) : health.backend === "checking" ? (
                    <span className="text-yellow-500">⏳ Checking...</span>
                  ) : (
                    <span className="text-red-500">✗ Service Degraded</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Refresh */}
        <div className="flex justify-center">
          <button
            onClick={checkBackendHealth}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
