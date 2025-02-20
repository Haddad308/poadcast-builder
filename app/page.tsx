"use client";

import dynamic from "next/dynamic";

const Page = dynamic(() => import("./index"), { ssr: false });

export default Page;
