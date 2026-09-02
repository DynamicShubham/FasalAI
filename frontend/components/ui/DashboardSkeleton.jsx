"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse w-full">
      {/* 1. Header Greeting Skeleton */}
      <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2.5 w-full max-w-md">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 bg-stone-200 rounded-md"></div>
            <div className="h-4 w-16 bg-stone-200 rounded-md"></div>
          </div>
          <div className="h-8 w-64 bg-stone-200 rounded-lg"></div>
          <div className="h-3.5 w-72 bg-stone-100 rounded-md"></div>
        </div>
        <div className="h-10 w-44 bg-stone-200 rounded-full flex-shrink-0"></div>
      </section>

      {/* 2. Standing Crop Card Skeleton */}
      <section className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
        <div className="flex justify-between items-start pb-3 border-b border-stone-100">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-stone-200 rounded"></div>
            <div className="h-7 w-40 bg-stone-200 rounded-lg"></div>
            <div className="h-3 w-48 bg-stone-100 rounded"></div>
          </div>
          <div className="h-7 w-28 bg-stone-100 rounded-lg"></div>
        </div>

        {/* 4 Metric Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2">
              <div className="h-2.5 w-16 bg-stone-200 rounded"></div>
              <div className="h-5 w-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Advisory Note */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-stone-200 flex-shrink-0"></div>
          <div className="h-4 w-full bg-stone-200 rounded"></div>
        </div>
      </section>

      {/* 3. Tasks & Weather 2-Column Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Farm Plan */}
        <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <div className="h-5 w-36 bg-stone-200 rounded"></div>
            <div className="h-5 w-20 bg-stone-100 rounded-full"></div>
          </div>

          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-stone-100 bg-stone-50 flex items-start gap-3"
              >
                <div className="w-4 h-4 rounded bg-stone-200 flex-shrink-0 mt-0.5"></div>
                <div className="flex-grow space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-48 bg-stone-200 rounded"></div>
                    <div className="h-3.5 w-16 bg-stone-200 rounded"></div>
                  </div>
                  <div className="h-3 w-full max-w-sm bg-stone-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Widget */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <div className="h-4 w-20 bg-stone-200 rounded"></div>
            <div className="h-4 w-16 bg-stone-100 rounded"></div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="space-y-1.5">
              <div className="h-9 w-24 bg-stone-200 rounded-lg"></div>
              <div className="h-3.5 w-20 bg-stone-100 rounded"></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-stone-200"></div>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1.5">
            <div className="h-3 w-28 bg-stone-200 rounded"></div>
            <div className="h-2.5 w-full bg-stone-100 rounded"></div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-2.5 w-6 bg-stone-200 rounded"></div>
                <div className="w-4 h-4 rounded bg-stone-200 my-0.5"></div>
                <div className="h-3 w-8 bg-stone-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Market & Schemes Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <div className="h-4 w-32 bg-stone-200 rounded"></div>
            <div className="h-3.5 w-24 bg-stone-100 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-40 bg-stone-200 rounded"></div>
            <div className="h-7 w-28 bg-stone-200 rounded-lg"></div>
          </div>
          <div className="h-10 w-full bg-stone-50 rounded-xl border border-stone-100"></div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200/80 shadow-subtle flex flex-col justify-between gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <div className="h-4 w-36 bg-stone-200 rounded"></div>
            <div className="h-3.5 w-24 bg-stone-100 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-stone-200 rounded"></div>
            <div className="h-5 w-48 bg-stone-200 rounded"></div>
            <div className="h-3 w-full bg-stone-100 rounded"></div>
          </div>
          <div className="h-9 w-full bg-stone-100 rounded-xl"></div>
        </div>
      </section>
    </div>
  );
}
