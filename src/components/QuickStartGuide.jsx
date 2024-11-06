import { motion } from "framer-motion";
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Info, X } from "lucide-react";

export default function QuickStartGuide({ onDismiss }) {
  const steps = ["Add your CurseForge API key in Settings", 'Go to the Mods page and click "Add Mod"', "Enter the CurseForge mod ID", "Set up Discord webhooks to receive notifications"];

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="shrink-0">
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <Info size={24} className="text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Quick Start Guide</h3>
                <p className="text-small text-default-500">Get started in 4 steps</p>
              </div>
            </div>
            <Button isIconOnly size="sm" variant="light" onPress={onDismiss} className="text-default-400 hover:text-default-600">
              <X size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          <motion.ol className="space-y-4">
            {steps.map((step, index) => (
              <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">{index + 1}</div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{step}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </CardBody>
      </Card>
    </motion.div>
  );
}
