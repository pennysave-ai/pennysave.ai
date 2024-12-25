import { Hero } from "@/components/common";
import { Card } from "@nextui-org/card";

export default async function DashboardPage() {
  return (
    <div className="relative z-10 flex flex-col w-full">
      <Hero />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 max-w-screen-2xl mx-auto px-4 w-full">
        <Card className="-mt-24 col-span-2">
          <div className="bg-default-300s p-8">
            <h1 className="text-2xl pb-2 font-bold mb-2">
              Transactions Overview
            </h1>
          </div>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <div className="bg-default-300s p-8">
            <h1 className="text-2xl pb-2 font-bold mb-2">
              Last Month Expences by category
            </h1>
          </div>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <div className="bg-default-300s p-8">
            <h1 className="text-2xl pb-2 font-bold mb-2">
              Last Month Income by category
            </h1>
          </div>
        </Card>
      </div>
    </div>
  );
}
