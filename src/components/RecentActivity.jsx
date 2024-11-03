import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Clock, Package2, Trash2, RefreshCw, Plus, AlertTriangle } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

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

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await invoke("get_activities");
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities:", err);
      setError("Failed to load recent activities");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await invoke("clear_activity_history");
      setActivities([]);
    } catch (err) {
      console.error("Failed to clear activity history:", err);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

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
          <Button isIconOnly variant="light" onPress={loadActivities}>
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
          <Button isIconOnly variant="light" onPress={loadActivities}>
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
                <span className="text-xs text-default-400">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default RecentActivity;
