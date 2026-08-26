import React, { HTMLAttributes, TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}