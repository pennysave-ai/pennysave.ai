"use server";
import { Card, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";

export default async function HowTo() {
  return (
    <section id="get-started" className="flex flex-col items-center mt-28 px-6">
      <h2 className="text-4xl font-bold text-center">
        How{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          It Works.
        </span>
      </h2>
      <div className="flex flex-col md:flex-row gap-y-3 md:gap-x-3 mt-12">
        <Card fullWidth className="border-none" shadow="sm">
          <CardBody>
            <div className="flex gap-x-4 items-center h-full">
              <div className="text-4xl font-bold text-default">1</div>
              <div className="text-default-600">
                <Link
                  href="/auth/sign-up"
                  className="text-blue-500 hover:underline"
                >
                  Join us today
                </Link>{" "}
                with one click using your Google or Apple account or by filling
                out the form.
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
                Use the dashboard to analyze your transactions, create a budget
                and enable notifications to stay on top of your finances.&nbsp;
                {/* use our AI financial advisor and get additional insights.  */}
                Enable financial reports subscription to get mothly report about
                your finances.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
