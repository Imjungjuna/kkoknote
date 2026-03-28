import Image from "next/image";
import WidgetLoader from "@/components/widget/WidgetLoader";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <WidgetLoader projectKey="ca590e97-e876-479d-93ee-9c68dd72c157" />
    </div>
  );
}
