import { useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import AIHelper from "./ai-helper";

const FloatingButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  return (
    <motion.div
      initial={{ borderRadius: "50%", width: 56, height: 56 }}
      animate={{
        borderRadius: isExpanded ? "16px" : "50%",
        width: isExpanded ? (isMobile ? "calc(100% - 24px)" : "500px") : 56,
        height: isExpanded ? "60vh" : 56,
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 500,
      }}
      className="fixed bottom-12 z-18 lg:right-[5%] right-3 z-10"
    >
      {isExpanded ? (
        <AIHelper onClose={() => setIsExpanded(false)} />
      ) : (
        <Button
          isIconOnly
          size="lg"
          className="p-1"
          variant="flat"
          onPress={() => setIsExpanded(true)}
        >
          <Icon icon="solar:star-fall-line-duotone" width={26} height={26} />
        </Button>
      )}
    </motion.div>
  );
};

export default FloatingButton;
