import { Divider } from "@nextui-org/divider";

export default function Custom404() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="p-4 flex gap-4">
        <div className="text-5xl">404</div>
        <div>
          <Divider orientation="vertical" />
        </div>
        <div className="self-center">This page could not be found</div>
      </div>
    </div>
  );
}
