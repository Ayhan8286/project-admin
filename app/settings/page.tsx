"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, AlertTriangle, BarChart3, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const { setTheme, theme } = useTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">
                    Manage system preferences, view reports, and monitor performance.
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General & Theme</TabsTrigger>
                    <TabsTrigger value="reports">System Reports</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="errors">Error Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the dashboard.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Theme Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Select your preferred theme.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={theme === "light" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => setTheme("light")}
                                    >
                                        <Sun className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={theme === "dark" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => setTheme("dark")}
                                    >
                                        <Moon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={theme === "system" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => setTheme("system")}
                                    >
                                        <Monitor className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Reports</CardTitle>
                            <CardDescription>Generated reports for the current month.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                                <div className="text-center space-y-2">
                                    <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto" />
                                    <p className="text-muted-foreground">No reports generated yet.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                                <Activity className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">99.9%</div>
                                <p className="text-xs text-muted-foreground">+0.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">API Latency</CardTitle>
                                <Activity className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">45ms</div>
                                <p className="text-xs text-muted-foreground">-5ms from last week</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="errors" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Error Logs</CardTitle>
                            <CardDescription>Recent system errors and warnings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                                <div className="text-center space-y-2">
                                    <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
                                    <p className="text-muted-foreground">No recent errors logged.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
