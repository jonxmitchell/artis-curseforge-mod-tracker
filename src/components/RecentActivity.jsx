"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardBody, Button, Tooltip, ScrollShadow, CircularProgress } from "@nextui-org/react";
import { Clock, Package2, Trash2, AlertTriangle, RefreshCw, Plus } from "lucide-react";
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
  <div className="flex items-center justify-center h-full">
    <CircularProgress size="lg" color="primary" aria-label="Loading activities" />
  </div>
);

const EmptyState = () => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", duration: 0.5 }} className="flex flex-col items-center justify-center h-full">
    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="mb-4">
      <Clock className="text-default-400" size={32} />
    </motion.div>
    <p className="text-center text-default-500">No recent activity</p>
  </motion.div>
);

const ErrorState = ({ error, onRetry }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full">
    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }} className="mb-4">
      <AlertTriangle className="text-danger" size={32} />
    </motion.div>
    <p className="text-center text-danger mb-4">{error}</p>
    <Button color="primary" variant="flat" onPress={onRetry} startContent={<RefreshCw size={18} />}>
      Try Again
    </Button>
  </motion.div>
);

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const scrollRef = useRef(null);
  const unlistenRef = useRef(null);
  const processedEventsRef = useRef(new Set());
  const notificationTimeoutRef = useRef(null);

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
      setError("Failed to clear activity history");
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (scrolledToBottom && visibleCount < activities.length) {
      setVisibleCount((prev) => Math.min(prev + 8, activities.length));
    }
  }, [activities.length, visibleCount]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  if (isLoading) return <LoadingPlaceholder />;
  if (error) return <ErrorState error={error} onRetry={loadActivities} />;
  if (activities.length === 0) return <EmptyState />;

  const visibleActivities = activities.slice(0, visibleCount);

  return (
    <Card className="bg-content1 backdrop-blur-md h-full">
      <CardHeader className="flex justify-between items-center px-6 py-4">
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
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button isIconOnly variant="light" color="danger" onPress={clearHistory} className="bg-danger/10">
              <Trash2 size={20} />
            </Button>
          </motion.div>
        )}
      </CardHeader>

      <CardBody className="p-0 overflow-hidden">
        <ScrollShadow ref={scrollRef} hideScrollBar className="h-full">
          <div className="px-4 py-4">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              <AnimatePresence mode="popLayout">
                {visibleActivities.map((activity) => (
                  <motion.div key={activity.id} variants={itemVariants} layout className="flex items-start gap-3 group">
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

            {visibleCount < activities.length && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-0 pt-4 mt-4 bg-gradient-to-t from-content1 to-transparent">
                <Button color="primary" variant="flat" size="sm" className="w-full" onPress={() => setVisibleCount((prev) => Math.min(prev + 8, activities.length))}>
                  Show More ({activities.length - visibleCount} remaining)
                </Button>
              </motion.div>
            )}
          </div>
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}
