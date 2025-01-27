"use client";
import React from "react";
import { CardBody } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";

interface SectionLoadingProps {
  icon: React.ReactNode;
}
const SectionLoading = ({ icon }: SectionLoadingProps) => {
  return (
    <CardBody className="p-0 text-default-500">
      <div className="flex items-start md:items-center flex-col md:flex-row gap-y-2 md:gap-y-0 justify-between bg-none rounded-medium px-4 py-[22px] border-medium border-divider">
        <div className="flex items-center gap-x-2">
          {icon}
          <div className="flex flex-col gap-y-2">
            <Skeleton className="w-[10vw] md:w-[80px] rounded-lg">
              <div className="h-3 rounded-lg bg-default-300" />
            </Skeleton>
            <Skeleton className="w-[20vw] md:w-[140px] rounded-lg">
              <div className="h-2 rounded-lg bg-default-300" />
            </Skeleton>
          </div>
        </div>
      </div>
    </CardBody>
  );
};

export default SectionLoading;
