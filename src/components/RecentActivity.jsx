import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Clock, Package2, Trash2, RefreshCw, Plus, AlertTriangle } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

const ActivityIcon = ({ type }) => {
  switch (type) {
    case "mod_added":
      return <Plus className="text-success" size={20} />;
    case "mod_updated":
      return <RefreshCw className="text-primary" size={20} />;
    case "mod_removed":
      return <Trash2 className="text-danger" size={20} />;
    case "webhook_error":
      return <AlertTriangle className="text-warning" size={20} />;
    default:
      return <Clock className="text-default-500" size={20} />;
  }
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

function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const unlistenRef = useRef(null);
  const activitiesRef = useRef([]);
  const timeoutRef = useRef(null);
  const processedEventsRef = useRef(new Set());

  // Update time ago for all activities
  const updateTimeAgo = useCallback(() => {
    setActivities((prevActivities) =>
      prevActivities.map((activity) => ({
        ...activity,
        timeAgo: formatTimeAgo(activity.timestamp),
      }))
    );
  }, []);

  // Load initial activities
  const loadActivities = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      const data = await invoke("get_activities");
      const activitiesWithTimeAgo = data.map((activity) => ({
        ...activity,
        timeAgo: formatTimeAgo(activity.timestamp),
      }));
      setActivities(activitiesWithTimeAgo);
      activitiesRef.current = activitiesWithTimeAgo;

      // Update processed events set with current IDs
      processedEventsRef.current = new Set(activitiesWithTimeAgo.map((a) => a.id));
    } catch (err) {
      console.error("Failed to load activities:", err);
      setError("Failed to load recent activities");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Handle new activity event
  const handleNewActivity = useCallback((event) => {
    const newActivity = event.payload;

    // Check if we've already processed this event
    if (processedEventsRef.current.has(newActivity.id)) {
      console.log("Duplicate event detected, skipping:", newActivity.id);
      return;
    }

    // Add the event ID to our processed set
    processedEventsRef.current.add(newActivity.id);

    // Add timeAgo to the new activity
    const activityWithTime = {
      ...newActivity,
      timeAgo: formatTimeAgo(newActivity.timestamp),
    };

    setActivities((prevActivities) => {
      // Double-check we're not adding a duplicate
      if (prevActivities.some((a) => a.id === newActivity.id)) {
        return prevActivities;
      }

      const updatedActivities = [activityWithTime, ...prevActivities];
      // Keep only the most recent 50 activities
      const trimmedActivities = updatedActivities.slice(0, 50);
      activitiesRef.current = trimmedActivities;
      return trimmedActivities;
    });
  }, []);

  const clearHistory = async () => {
    try {
      await invoke("clear_activity_history");
      setActivities([]);
      activitiesRef.current = [];
      processedEventsRef.current.clear();
    } catch (err) {
      console.error("Failed to clear activity history:", err);
    }
  };

  // Set up event listeners and interval updates
  useEffect(() => {
    const setup = async () => {
      // Only set up the listener if it hasn't been set up yet
      if (!unlistenRef.current) {
        const unlisten = await listen("new_activity", handleNewActivity);
        unlistenRef.current = unlisten;
      }

      // Load initial activities
      await loadActivities();

      // Update time ago every minute
      timeoutRef.current = setInterval(() => {
        updateTimeAgo();
      }, 60000);
    };

    setup();

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      processedEventsRef.current.clear();
    };
  }, [loadActivities, handleNewActivity, updateTimeAgo]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-4">Loading activities...</div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Button isIconOnly variant="light" onPress={() => loadActivities()}>
            <RefreshCw size={20} />
          </Button>
        </CardHeader>
        <CardBody>
          <div className="text-center text-danger py-4">{error}</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="flex gap-2">
          <Button isIconOnly variant="light" onPress={() => loadActivities(false)}>
            <RefreshCw size={20} />
          </Button>
          {activities.length > 0 && (
            <Button isIconOnly variant="light" color="danger" onPress={clearHistory}>
              <Trash2 size={20} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {activities.length === 0 ? (
          <div className="text-center py-4 text-default-500">No recent activity</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <ActivityIcon type={activity.activity_type} />
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  {activity.mod_name && (
                    <p className="text-xs text-default-500 mt-1">
                      <Package2 className="inline mr-1" size={12} />
                      {activity.mod_name}
                    </p>
                  )}
                </div>
                <span className="text-xs text-default-400">{activity.timeAgo}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default RecentActivity;
