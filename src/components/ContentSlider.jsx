import { useRef, useContext } from "react";
import Image from "next/image";
import SimpleButton from "@/components/SimpleButton";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import UserContext from "@/utils/UserContext";
import { useRouter } from "next/navigation";

const RelatedSlider = ({ content }) => {
  const slider = useRef(null);
  const { theme } = useContext(UserContext);
  const router = useRouter();

  const scroll = (dir) => {
    if (!slider.current) return;
    const width = slider.current.clientWidth;
    slider.current.scrollBy({
      left: dir === "next" ? width : -width,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`relative mt-4 p-3 rounded-md ${theme.colorBg} ${theme.hoverShadow}`}
    >
      {/* Left arrow */}
      <button
        onClick={() => scroll("prev")}
        className={`absolute left-0 top-1/2 z-10 p-2 rounded-full shadow-lg ${theme.colorBg}`}
      >
        <FaChevronLeft />
      </button>

      <div
        ref={slider}
        className="flex space-x-4 overflow-x-auto scroll-pl-4 snap-x snap-mandatory scrollbar-hide"
      >
        {content.map((p) => (
          <div
            key={p.id}
            className="snap-start flex-shrink-0 w-full sm:w-1/2 lg:w-1/4"
          >
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image
                src={p.baseProductData.imageUrl}
                alt={p.baseProductData.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                priority
              />
            </div>
            <h3 className="mt-2 text-sm font-medium">
              {p.baseProductData.name}
            </h3>
            <p className="text-base font-semibold">
              PKR {p.price.toLocaleString("en-PK")}
            </p>
            <div className="p-3">
              <SimpleButton
                onClick={() => {
                  router.push(`/market/product?id=${p.id}`);
                }}
                btnText="View"
                type="default"
                extraclasses="mt-2 w-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("next")}
        className={`absolute right-0 top-1/2 z-10 p-2 rounded-full shadow-lg ${theme.colorBg}`}
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

export default RelatedSlider;
