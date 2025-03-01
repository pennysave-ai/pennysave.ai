import { Card, CardBody } from "@heroui/card";
export default function HowTo() {
  return (
    <section id="get-started" className="flex flex-col items-center mt-20 px-6">
      <h2 className="text-4xl font-bold text-center">
        Just{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          3 simple steps
        </span>{" "}
        to get started.
      </h2>
      <div className="flex flex-col md:flex-row gap-y-3 md:gap-x-3 mt-12">
        <Card fullWidth className="border-none" shadow="sm">
          <CardBody>
            <div className="flex gap-x-4 items-center h-full">
              <div className="text-4xl font-bold text-default">1</div>
              <div className="text-default-600">
                Join us today, with one click using your Google or Apple account
                or by filling out the form.
              </div>
            </div>
          </CardBody>
        </Card>
        <Card fullWidth className="border-none" shadow="sm">
          <CardBody>
            <div className="flex gap-x-4 items-center h-full">
              <div className="text-4xl font-bold text-default">2</div>
              <div className="text-default-600">
                Create your first account, transaction categories. Start adding
                your transactions or import them by uploading a CSV file. You
                can also connect your bank account to automate the process.
              </div>
            </div>
          </CardBody>
        </Card>
        <Card fullWidth className="border-none" shadow="sm">
          <CardBody>
            <div className="flex gap-x-4 items-center h-full">
              <div className="text-4xl font-bold text-default">3</div>
              <div className="text-default-600">
                Use the dashboard to analize your transactions, use our AI
                financial advisor and get additional insights. Enable financial
                reports subscription to get mothly report about your finances.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
