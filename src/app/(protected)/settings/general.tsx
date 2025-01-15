import { CardBody, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";

export default function General() {
  return (
    <>
      <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
        <p className="text-large">General Settings</p>
        <p className="text-small text-default-500">Manage your data</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-y-2">
        <div className="flex items-center justify-between bg-content2 rounded-medium p-4">
          <div>
            Subscription
            <div className="text-small text-default-500">
              No active subscription
            </div>
          </div>
          <div>
            <Button color="primary">Subscribe</Button>
          </div>
        </div>
        <div className="flex items-center justify-between bg-content2 rounded-medium p-4">
          <div>
            Bank Account
            <div className="text-small text-default-500">
              No bank account connected
            </div>
          </div>
          <div>
            <Button color="primary">Connect</Button>
          </div>
        </div>
      </CardBody>
    </>
  );
}
