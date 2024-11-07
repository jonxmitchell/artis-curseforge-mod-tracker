"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardBody, Button, Tooltip, ScrollShadow } from "@nextui-org/react";
import { Clock, Package2, Trash2, Plus, AlertTriangle, ChevronDown } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

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
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`p-2 rounded-xl bg-${color}/10`}>
      <Icon size={18} className={`text-${color}`} />
    </motion.div>
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

const LoadingPlaceholder = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-default-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-default-100 rounded w-3/4" />
          <div className="h-3 bg-default-100 rounded w-1/2" />
        </div>
      </motion.div>
    ))}
  </motion.div>
);

const EmptyState = () => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", duration: 0.5 }} className="flex flex-col items-center justify-center p-8 h-full">
    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="mb-2">
      <Clock className="text-default-400" size={24} />
    </motion.div>
    <p className="text-center text-default-500">No recent activity</p>
  </motion.div>
);

const ErrorState = ({ error, onRetry }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 h-full">
    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }} className="mb-2">
      <AlertTriangle className="text-danger" size={24} />
    </motion.div>
    <p className="text-center text-danger">{error}</p>
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button color="primary" variant="flat" onPress={onRetry} className="mt-4">
        Try Again
      </Button>
    </motion.div>
  </motion.div>
);

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

  return (
    <Card className="bg-content backdrop-blur-md h-full">
      <CardHeader className="flex justify-between items-center shrink-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.1, rotate: 360 }} transition={{ duration: 0.5 }} className="p-2 rounded-xl bg-primary/10">
            <Clock size={24} className="text-primary" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <p className="text-small text-default-500">System updates and changes</p>
          </div>
        </motion.div>
        {activities.length > 0 && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-xl bg-danger/10">
            <Trash2 size={20} className="text-danger cursor-pointer" onClick={clearHistory} />
          </motion.div>
        )}
      </CardHeader>
      <CardBody className="p-0 overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={loadActivities} />
        ) : isLoading ? (
          <LoadingPlaceholder />
        ) : activities.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollShadow hideScrollBar className="h-full">
            <div className="px-4 py-4">
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {activities.slice(0, isExpanded ? undefined : 25).map((activity) => (
                    <motion.div key={activity.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex items-start gap-3 group">
                      <ActivityIcon type={activity.activity_type} />
                      <motion.div className="flex-1 min-w-0" whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                        <p className="text-sm">{activity.description}</p>
                        {activity.mod_name && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 mt-1">
                            <Package2 className="text-default-400" size={12} />
                            <span className="text-xs text-default-400 truncate">{activity.mod_name}</span>
                          </motion.div>
                        )}
                      </motion.div>
                      <Tooltip content={new Date(activity.timestamp).toLocaleString()}>
                        <motion.span whileHover={{ scale: 1.1 }} className="text-xs text-default-400 whitespace-nowrap">
                          {activity.timeAgo}
                        </motion.span>
                      </Tooltip>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {activities.length > 8 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    className="w-full mt-4"
                    endContent={
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown size={18} />
                      </motion.div>
                    }
                    onPress={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Show Less" : "Show More"}
                  </Button>
                </motion.div>
              )}
            </div>
          </ScrollShadow>
        )}
      </CardBody>
    </Card>
  );
}
