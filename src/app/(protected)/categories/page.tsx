import { Hero } from "@/components/common";
import CategoriesCard from "./categories-card";

export default async function CategoriesPage() {
  return (
    <>
      <div className="relative z-10 flex flex-col w-full">
        <Hero description="Add, edit or delete your categories" />
        <div className="flex px-4 w-full justify-center">
          <CategoriesCard />
        </div>
      </div>
    </>
  );
}
