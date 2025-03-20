import { Tooltip } from "@heroui/tooltip";

interface AccountNameProps {
  name: string;
  last4: string | null;
}
export const AccountName = ({ name, last4 }: AccountNameProps) => {
  return (
    <div className="capitalize text-default-foreground flex gap-x-2 items-center">
      <div>{name}</div>
      {last4 && (
        <Tooltip content="Connected account">
          <div className="text-xs text-default-400">(*{last4})</div>
        </Tooltip>
      )}
    </div>
  );
};
