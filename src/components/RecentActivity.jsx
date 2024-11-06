"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardBody, Button, Tooltip, ScrollShadow } from "@nextui-org/react";
import { Clock, Package2, Trash2, Plus, AlertTriangle, ChevronDown } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

const ActivityIcon = ({ type }) => {
  const iconMap = {
    mod_added: { icon: Plus, color: "success" },
    mod_updated: { icon: Clock, color: "primary" },
    mod_removed: { icon: Trash2, color: "danger" },
    webhook_error: { icon: AlertTriangle, color: "warning" },
    webhook_added: { icon: Plus, color: "success" },
    webhook_removed: { icon: Trash2, color: "danger" },
    webhook_updated: { icon: Clock, color: "primary" },
    webhook_assigned: { icon: Plus, color: "success" },
    webhook_unassigned: { icon: Trash2, color: "danger" },
    notification_sent: { icon: Clock, color: "primary" },
  };

  const { icon: Icon, color } = iconMap[type] || { icon: Clock, color: "default" };

  return (
    <div className={`p-2 rounded-xl bg-${color}/10`}>
      <Icon size={18} className={`text-${color}`} />
    </div>
  );
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - activityTime) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return activityTime.toLocaleDateString();
};

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const unlistenRef = useRef(null);
  const processedEventsRef = useRef(new Set());

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await invoke("get_activities");
      const activitiesWithTimeAgo = data.map((activity) => ({
        ...activity,
        timeAgo: formatTimeAgo(activity.timestamp),
      }));
      setActivities(activitiesWithTimeAgo);
      processedEventsRef.current = new Set(activitiesWithTimeAgo.map((a) => a.id));
    } catch (err) {
      console.error("Failed to load activities:", err);
      setError("Failed to load recent activities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewActivity = useCallback((event) => {
    const newActivity = event.payload;
    if (processedEventsRef.current.has(newActivity.id)) return;

    processedEventsRef.current.add(newActivity.id);

    setActivities((prevActivities) => {
      if (prevActivities.some((a) => a.id === newActivity.id)) return prevActivities;
      const activityWithTime = {
        ...newActivity,
        timeAgo: formatTimeAgo(newActivity.timestamp),
      };
      return [activityWithTime, ...prevActivities].slice(0, 50);
    });
  }, []);

  useEffect(() => {
    const setup = async () => {
      if (!unlistenRef.current) {
        const unlisten = await listen("new_activity", handleNewActivity);
        unlistenRef.current = unlisten;
      }
      await loadActivities();

      const interval = setInterval(() => {
        setActivities((prevActivities) =>
          prevActivities.map((activity) => ({
            ...activity,
            timeAgo: formatTimeAgo(activity.timestamp),
          }))
        );
      }, 60000);

      return () => clearInterval(interval);
    };

    setup();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      processedEventsRef.current.clear();
    };
  }, [loadActivities, handleNewActivity]);

  const clearHistory = async () => {
    try {
      await invoke("clear_activity_history");
      setActivities([]);
      processedEventsRef.current.clear();
    } catch (err) {
      console.error("Failed to clear activity history:", err);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-content1/60 backdrop-blur-md h-full">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Clock size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Recent Activity</h2>
              <p className="text-small text-default-500">Loading...</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-default-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-default-100 rounded w-3/4" />
                  <div className="h-3 bg-default-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-content backdrop-blur-md h-full">
      <CardHeader className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Clock size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <p className="text-small text-default-500">System updates and changes</p>
          </div>
        </div>
        {activities.length > 0 && (
          <div className={`p-2 rounded-xl bg-danger/10`}>
            <Trash2 size={20} className="text-danger cursor-pointer" onClick={clearHistory} />
          </div>
        )}
      </CardHeader>
      <CardBody className="p-0 overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 h-full">
            <AlertTriangle className="text-danger mb-2" size={24} />
            <p className="text-center text-danger">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 h-full">
            <Clock className="text-default-400 mb-2" size={24} />
            <p className="text-center text-default-500">No recent activity</p>
          </div>
        ) : (
          <ScrollShadow hideScrollBar className="h-full">
            <div className="px-4 py-4">
              <div className="space-y-4">
                {activities.slice(0, isExpanded ? undefined : 25).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 group">
                    <ActivityIcon type={activity.activity_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      {activity.mod_name && (
                        <div className="flex items-center gap-1 mt-1">
                          <Package2 className="text-default-400" size={12} />
                          <span className="text-xs text-default-400 truncate">{activity.mod_name}</span>
                        </div>
                      )}
                    </div>
                    <Tooltip content={new Date(activity.timestamp).toLocaleString()}>
                      <span className="text-xs text-default-400 whitespace-nowrap">{activity.timeAgo}</span>
                    </Tooltip>
                  </div>
                ))}
              </div>
              {activities.length > 8 && (
                <Button variant="flat" color="primary" size="sm" className="w-full mt-4" endContent={<ChevronDown size={18} className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />} onPress={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>
          </ScrollShadow>
        )}
      </CardBody>
    </Card>
  );
}
