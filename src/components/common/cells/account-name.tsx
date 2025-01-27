import { Tooltip } from "@heroui/tooltip";

interface AccountNameProps {
  name: string;
  mask: string | null;
}
export const AccountName = ({ name, mask }: AccountNameProps) => {
  return (
    <div className="capitalize text-default-foreground flex gap-x-2 items-center">
      <div>{name}</div>
      {mask && (
        <Tooltip content="Connected account">
          <div className="text-xs text-default-400">(*{mask})</div>
        </Tooltip>
      )}
    </div>
  );
};
