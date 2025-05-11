import Link from "next/link";
import Image from "next/image";

const Logo = ({ onClick, classes }) => {
  return (
    <div className={`flex select-none ${classes}`} onClick={onClick}>
      <Link href={"/"}>
        <span className="flex">
          <Image
            className="w-24"
            src="/graphics/logo.png"
            alt="This is the logo of the platform"
            width={96} // Matches "w-24" (24 x 4px = 96px)
            height={96} // Specify height for correct aspect ratio
            priority // Ensures the logo is loaded quickly as it's likely critical
          />
        </span>
      </Link>
    </div>
  );
};

export default Logo;
