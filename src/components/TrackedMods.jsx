import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardBody, Button, Chip, Tooltip, ScrollShadow } from "@nextui-org/react";
import { Package2, ArrowUpRight, Gamepad2, Plus, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

function ModChip({ name, lastUpdated, onClick }) {
  return (
    <Tooltip
      content={
        <div className="px-1 py-2">
          <div className="text-small font-bold">{name}</div>
          <div className="text-tiny flex items-center mt-1 text-default-400">
            <Clock size={12} className="mr-1" />
            {new Date(lastUpdated).toLocaleDateString()}
          </div>
        </div>
      }
    >
      <Chip
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={onClick}
        variant="flat"
        classNames={{
          base: "bg-default-100 hover:bg-default-200",
          content: "text-small",
        }}
      >
        {name}
      </Chip>
    </Tooltip>
  );
}

function EmptyModsState({ onAdd }) {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <Package2 size={32} className="text-primary" />
      </div>
      <p className="text-lg font-medium mb-2">No mods tracked yet</p>
      <Button color="primary" variant="flat" onPress={onAdd} startContent={<Plus size={18} />}>
        Add Your First Mod
      </Button>
    </motion.div>
  );
}

export default function TrackedMods({ mods, onAddMod }) {
  const router = useRouter();

  const groupedMods = useMemo(() => {
    const groups = new Map();

    mods.forEach((mod) => {
      const modInfo = mod.mod_info || mod;
      const gameName = modInfo.game_name;

      if (!groups.has(gameName)) {
        groups.set(gameName, []);
      }

      groups.get(gameName).push({
        id: modInfo.id,
        name: modInfo.name,
        game_name: gameName,
        last_updated: modInfo.last_updated,
      });
    });

    return groups;
  }, [mods]);

  return (
    <Card className="flex-1 bg-content1/70 backdrop-blur-md">
      <CardHeader className="shrink-0 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Package2 size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Tracked Mods</h2>
            <p className="text-small text-default-500">By game category</p>
          </div>
        </div>
        <Button color="primary" variant="light" endContent={<ArrowUpRight size={16} />} onPress={() => router.push("/mods")}>
          View All
        </Button>
      </CardHeader>
      <CardBody className="overflow-hidden p-0">
        {!mods.length ? (
          <EmptyModsState onAdd={onAddMod} />
        ) : (
          <ScrollShadow className="h-full" hideScrollBar>
            <motion.div className="px-6 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="space-y-6">
                {Array.from(groupedMods.entries()).map(([game, gameMods]) => (
                  <motion.div key={game} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-md bg-secondary/10">
                        <Gamepad2 size={16} className="text-secondary" />
                      </div>
                      <p className="font-medium text-default-700">{game}</p>
                      <div className="h-[1px] flex-1 bg-default-200/30 mx-2" />
                      <Chip
                        size="sm"
                        variant="flat"
                        classNames={{
                          base: "bg-secondary/10",
                          content: "text-tiny font-medium text-secondary",
                        }}
                      >
                        {gameMods.length} {gameMods.length === 1 ? "mod" : "mods"}
                      </Chip>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gameMods.map((mod) => (
                        <ModChip key={mod.id} name={mod.name} lastUpdated={mod.last_updated} onClick={() => router.push("/mods")} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </ScrollShadow>
        )}
      </CardBody>
    </Card>
  );
}
