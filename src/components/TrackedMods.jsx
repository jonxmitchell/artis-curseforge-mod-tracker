import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardBody, Button, Chip } from "@nextui-org/react";
import { Package2, ArrowUpRight, Gamepad2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

function ModCard({ name, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="group">
      <Button variant="flat" className="w-full justify-start h-auto py-3 px-4 bg-content2/40 hover:bg-content2/80" onClick={onClick}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20">
            <Package2 size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-default-700">{name}</p>
            <p className="text-tiny text-default-500">Last checked: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </Button>
    </motion.div>
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

  console.log("TrackedMods - Grouped Mods:", Array.from(groupedMods.entries()));

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
          <motion.div className="h-full overflow-y-auto px-6 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="space-y-6">
              {Array.from(groupedMods.entries()).map(([game, gameMods]) => (
                <motion.div key={game} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
                  <div className="flex items-center gap-2">
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
                  <div className="grid grid-cols-2 gap-3">
                    {gameMods.map((mod) => (
                      <ModCard key={mod.id} name={mod.name} onClick={() => router.push("/mods")} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </CardBody>
    </Card>
  );
}
