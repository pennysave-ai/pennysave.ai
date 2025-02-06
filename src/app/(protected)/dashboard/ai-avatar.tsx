import { Icon } from "@iconify/react";
import { Spinner } from "@heroui/spinner";
import { cn } from "@heroui/theme";

interface AIAvatarProps {
  error?: boolean;
  loading?: boolean;
}
export default function AiAvatar({
  error = false,
  loading = false,
}: AIAvatarProps) {
  return (
    <div className="realtive flex items-center justify-start gap-2">
      <div className="w-10 h-10 flex items-center justify-center relative">
        {loading ? (
          <Spinner size="lg" className="absolute" />
        ) : (
          <div
            className={cn(
              "w-10 h-10 rounded-full border-solid absolute border-3",
              error ? "border-danger" : "border-primary"
            )}
          />
        )}
        <Icon
          width={28}
          height={28}
          icon="solar:star-fall-line-duotone"
          className={cn(error ? "text-danger" : "text-primary")}
        />
      </div>
    </div>
  );
}
