"use client";

import dynamic from "next/dynamic";

const Page = dynamic(() => import("../app/index"), { ssr: false });

export default Page;
