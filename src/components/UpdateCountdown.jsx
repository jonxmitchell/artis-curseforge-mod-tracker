"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Tooltip } from "@nextui-org/react";
import { Clock, RefreshCw } from "lucide-react";
import { useUpdateService } from "@/contexts/UpdateServiceContext";

export default function UpdateCountdown() {
  const { nextCheckTime, isChecking, updateInterval } = useUpdateService();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (nextCheckTime) {
        const now = new Date();
        const diff = new Date(nextCheckTime) - now;

        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [nextCheckTime]);

  if (!timeLeft) return null;

  return (
    <Card className="bg-content1/50 backdrop-blur-md">
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-primary/10`}>{isChecking ? <RefreshCw size={24} className="text-primary animate-spin" /> : <Clock size={24} className="text-primary" />}</div>

          <div className="flex-1">
            <p className="text-sm font-medium text-default-600">Next Check In</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <TimeUnit value={timeLeft.hours} unit="h" />
              <span className="text-default-400 text-xl">:</span>
              <TimeUnit value={timeLeft.minutes} unit="m" />
              <span className="text-default-400 text-xl">:</span>
              <TimeUnit value={timeLeft.seconds} unit="s" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function TimeUnit({ value, unit }) {
  return (
    <div className="flex items-center group">
      <span className="font-bold text-2xl min-w-[32px] text-center tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="text-xs text-default-400 group-hover:text-primary transition-colors ml-0.5">{unit}</span>
    </div>
  );
}
